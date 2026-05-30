import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // internal or external

    const where: any = {}
    if (type) {
      where.accountType = type
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: true },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Fetch transactions error:", error)
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { type, category, amount, description, accountType, projectId } = await request.json()

    if (!amount || !description || !accountType) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        accountType,
        projectId: projectId || null,
        creatorId: session.user.id,
      },
      include: { project: true },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "创建记录失败" }, { status: 500 })
  }
}
