import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { name, nickname, email, password, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: "邮箱已被使用" }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        nickname: nickname || null,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}
