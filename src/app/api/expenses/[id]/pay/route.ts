import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { id } = await params

    // 获取报销记录
    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return NextResponse.json({ error: "报销记录不存在" }, { status: 404 })
    }

    if (expense.status !== "approved") {
      return NextResponse.json({ error: "该报销未通过审批" }, { status: 400 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: "paid",
      },
      include: {
        project: true,
        submitter: true,
      },
    })

    // 打款时创建账目记录
    // 内账：记录所有支出（真实成本）
    await prisma.transaction.create({
      data: {
        type: "expense",
        category: "reimbursement",
        amount: expense.amount,
        description: `报销：${expense.description}`,
        accountType: "internal",
        account: expense.account || "public",
        hasInvoice: expense.hasInvoice,
        projectId: expense.projectId,
        creatorId: session.user.id,
      },
    })

    // 外账：只记录公司发票（用于报税）
    // 其他单位发票不进外账
    if (expense.invoiceType === "company") {
      await prisma.transaction.create({
        data: {
          type: "expense",
          category: "reimbursement",
          amount: expense.amount,
          description: `报销：${expense.description}`,
          accountType: "external",
          account: expense.account || "public",
          hasInvoice: true,
          projectId: expense.projectId,
          creatorId: session.user.id,
        },
      })
    }

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Pay expense error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}
