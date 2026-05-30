import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    // 获取所有已处理的报销记录（已通过、已拒绝、已打款）
    const expenses = await prisma.expense.findMany({
      where: {
        status: {
          in: ["approved", "rejected", "paid"],
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        project: true,
        submitter: true,
        approver: true,
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Fetch expense history error:", error)
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
  }
}
