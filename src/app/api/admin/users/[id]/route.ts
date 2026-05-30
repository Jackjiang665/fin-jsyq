import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { id } = await params

    // 不能删除自己
    if (id === session.user.id) {
      return NextResponse.json({ error: "不能删除自己" }, { status: 400 })
    }

    // 检查用户是否有相关数据
    const expenses = await prisma.expense.findMany({
      where: { submitterId: id },
    })

    const salaries = await prisma.salary.findMany({
      where: { userId: id },
    })

    if (expenses.length > 0 || salaries.length > 0) {
      return NextResponse.json(
        { error: "该用户有报销或工资记录，无法删除" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}
