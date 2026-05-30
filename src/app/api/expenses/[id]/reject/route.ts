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
    const { reason } = await request.json()

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "请填写拒绝原因" }, { status: 400 })
    }

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

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: "rejected",
        rejectReason: reason.trim(),
        approverId: session.user.id,
      },
      include: {
        project: true,
        submitter: true,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Reject expense error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}
