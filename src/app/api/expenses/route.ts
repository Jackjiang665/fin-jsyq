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
    const scope = searchParams.get("scope") // "mine" or "all"

    // "我的报销"只显示自己提交的
    // 默认都是显示自己的报销
    const where: any = {
      submitterId: session.user.id,
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: true,
        submitter: true,
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Fetch expenses error:", error)
    return NextResponse.json({ error: "获取报销记录失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { amount, description, projectId, fundSource, hasInvoice, invoiceType, invoiceNote, invoiceImage, receiptImage, paymentImage } = await request.json()

    if (!amount || !description || !projectId) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 判断是否高额报销（超过1000元）
    const isHighAmount = parseFloat(amount) > 1000

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        projectId,
        submitterId: session.user.id,
        fundSource: fundSource || "personal",
        account: "public", // 默认公户，财务审批时可以修改
        hasInvoice: hasInvoice !== false,
        invoiceType: hasInvoice ? (invoiceType || "company") : null,
        invoiceNote: hasInvoice && invoiceType === "other" ? invoiceNote : null,
        isHighAmount,
        invoiceImage: invoiceImage || null,
        receiptImage: receiptImage || null,
        paymentImage: paymentImage || null,
        status: "pending",
      },
      include: {
        project: true,
        submitter: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ error: "创建报销失败" }, { status: 500 })
  }
}
