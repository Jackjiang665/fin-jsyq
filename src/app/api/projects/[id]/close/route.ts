import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    if (project.status === "closed") {
      return NextResponse.json({ error: "项目已封账" }, { status: 400 })
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status: "closed" },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Close project error:", error)
    return NextResponse.json({ error: "封账失败" }, { status: 500 })
  }
}
