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

    // 检查项目是否有关联的报销或账目
    const expenses = await prisma.expense.findMany({
      where: { projectId: id },
    })

    const transactions = await prisma.transaction.findMany({
      where: { projectId: id },
    })

    if (expenses.length > 0 || transactions.length > 0) {
      return NextResponse.json(
        { error: "该项目下有报销或账目记录，无法删除" },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "删除项目失败" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { createdAt: "desc" },
          include: { submitter: true },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Fetch project error:", error)
    return NextResponse.json({ error: "获取项目失败" }, { status: 500 })
  }
}
