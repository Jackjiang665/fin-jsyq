import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const reimbursements = await prisma.externalReimbursement.findMany({
      orderBy: { createdAt: "desc" },
      include: { project: true },
    })

    return NextResponse.json(reimbursements)
  } catch (error) {
    console.error("Fetch external reimbursements error:", error)
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { projectId, source, amount, description } = await request.json()

    if (!projectId || !source || !amount) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    const reimbursement = await prisma.externalReimbursement.create({
      data: {
        projectId,
        source,
        amount: parseFloat(amount),
        description: description || null,
        status: "pending",
      },
      include: { project: true },
    })

    return NextResponse.json(reimbursement)
  } catch (error) {
    console.error("Create external reimbursement error:", error)
    return NextResponse.json({ error: "创建记录失败" }, { status: 500 })
  }
}
