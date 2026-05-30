import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { nickname } = await request.json()

    if (!nickname || nickname.trim() === "") {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 })
    }

    // 使用 email 查找用户，因为 session 中可能没有 id
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { nickname: nickname.trim() },
    })

    return NextResponse.json({ success: true, nickname: updatedUser.nickname })
  } catch (error) {
    console.error("Update nickname error:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}
