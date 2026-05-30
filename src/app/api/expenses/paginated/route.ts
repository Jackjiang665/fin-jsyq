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
    const scope = searchParams.get("scope") || "mine" // "mine" or "all"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const projectId = searchParams.get("projectId")
    const submitterId = searchParams.get("submitterId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // 构建查询条件
    const where: any = {}

    // 范围：我的报销或全部
    if (scope === "mine") {
      where.submitterId = session.user.id
    }

    // 项目筛选
    if (projectId) {
      where.projectId = projectId
    }

    // 提交人筛选
    if (submitterId) {
      where.submitterId = submitterId
    }

    // 状态筛选
    if (status && status !== "all") {
      where.status = status
    }

    // 搜索（模糊匹配描述）
    if (search) {
      where.description = {
        contains: search,
      }
    }

    // 日期范围筛选
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z")
      }
    }

    // 计算总数
    const total = await prisma.expense.count({ where })

    // 获取分页数据
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: true,
        submitter: true,
        approver: true,
      },
    })

    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Fetch paginated expenses error:", error)
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
  }
}
