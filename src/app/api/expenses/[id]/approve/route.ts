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
    const { account } = await request.json()

    // 获取报销记录
    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return NextResponse.json({ error: "报销记录不存在" }, { status: 404 })
    }

    if (expense.status !== "pending") {
      return NextResponse.json({ error: "该报销已处理" }, { status: 400 })
    }

    // 如果是高额报销且当前是财务审批，则状态改为"待董事长审批"
    // 如果是普通报销或当前是管理员审批，则直接通过
    const newStatus = expense.isHighAmount && session.user.role === "finance" ? "pending" : "approved"

    // 如果是高额报销且财务已审批，需要董事长二次审批
    // 这里简化处理：高额报销直接由管理员审批通过
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: newStatus,
        approverId: session.user.id,
        account: account || "public",
      },
      include: {
        project: true,
        submitter: true,
      },
    })

    // 注意：不在审批时创建账目记录，而是在打款时创建
    // 这样更符合财务流程：审批通过 → 打款 → 记账

    return NextResponse.json(updatedExpense)
  } catch (error: any) {
    console.error("Approve expense error:", error)
    return NextResponse.json({ error: error.message || "审批失败" }, { status: 500 })
  }
}
