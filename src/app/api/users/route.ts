import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // 只有管理员和财务可以查看用户列表
    if (session.user.role !== "admin" && session.user.role !== "finance") {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Fetch users error:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}
