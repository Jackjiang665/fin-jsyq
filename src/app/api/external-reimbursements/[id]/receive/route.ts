import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { id } = await params

    const reimbursement = await prisma.externalReimbursement.findUnique({
      where: { id },
    })

    if (!reimbursement) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 })
    }

    if (reimbursement.status === "received") {
      return NextResponse.json({ error: "已标记为已回款" }, { status: 400 })
    }

    const updatedReimbursement = await prisma.externalReimbursement.update({
      where: { id },
      data: {
        status: "received",
        receivedAt: new Date(),
      },
      include: { project: true },
    })

    return NextResponse.json(updatedReimbursement)
  } catch (error) {
    console.error("Receive external reimbursement error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}
