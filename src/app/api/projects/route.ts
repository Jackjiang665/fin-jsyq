import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Fetch projects error:", error)
    return NextResponse.json({ error: "获取项目失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 })
    }

    // 检查项目名是否已存在
    const existing = await prisma.project.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: "项目名称已存在" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "创建项目失败" }, { status: 500 })
  }
}
