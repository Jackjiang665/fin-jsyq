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
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const where: any = {}

    // 如果是员工，只能看自己的工资
    if (session.user.role === "employee" || session.user.role === "director") {
      where.userId = session.user.id
    }

    if (year) {
      where.year = parseInt(year)
    }
    if (month) {
      where.month = parseInt(month)
    }

    const salaries = await prisma.salary.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { user: true },
    })

    return NextResponse.json(salaries)
  } catch (error) {
    console.error("Fetch salaries error:", error)
    return NextResponse.json({ error: "获取工资记录失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "finance")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { userId, year, month, baseSalary, allowance, deduction, note } = await request.json()

    if (!userId || !year || !month || !baseSalary) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 检查是否已存在该月工资记录
    const existing = await prisma.salary.findUnique({
      where: {
        userId_year_month: {
          userId,
          year: parseInt(year),
          month: parseInt(month),
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "该月工资记录已存在" }, { status: 400 })
    }

    const salary = await prisma.salary.create({
      data: {
        userId,
        year: parseInt(year),
        month: parseInt(month),
        baseSalary: parseFloat(baseSalary),
        allowance: parseFloat(allowance) || 0,
        deduction: parseFloat(deduction) || 0,
        total: parseFloat(baseSalary) + (parseFloat(allowance) || 0) - (parseFloat(deduction) || 0),
        note: note || null,
      },
      include: { user: true },
    })

    return NextResponse.json(salary)
  } catch (error) {
    console.error("Create salary error:", error)
    return NextResponse.json({ error: "创建工资记录失败" }, { status: 500 })
  }
}
