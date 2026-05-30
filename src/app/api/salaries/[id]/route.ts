import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { id } = await params

    await prisma.salary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete salary error:", error)
    return NextResponse.json({ error: "删除工资记录失败" }, { status: 500 })
  }
}
