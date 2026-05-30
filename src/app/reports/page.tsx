"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  description: string | null
}

interface ProjectStats {
  project: Project
  internalExpense: number
  externalExpense: number
  totalExpenses: number
  transactionCount: number
}

interface OverallStats {
  totalIncome: number
  totalExpense: number
  internalIncome: number
  internalExpense: number
  externalIncome: number
  externalExpense: number
  totalSalary: number
  projectCount: number
  userCount: number
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalIncome: 0,
    totalExpense: 0,
    internalIncome: 0,
    internalExpense: 0,
    externalIncome: 0,
    externalExpense: 0,
    totalSalary: 0,
    projectCount: 0,
    userCount: 0,
  })
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin" && session?.user?.role !== "finance" && session?.user?.role !== "director") {
      router.push("/")
    }
    fetchReportData()
  }, [session, status, router])

  const fetchReportData = async () => {
    try {
      const [transRes, projectsRes, salariesRes, usersRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/projects"),
        fetch("/api/salaries"),
        fetch("/api/users"),
      ])

      if (transRes.ok && projectsRes.ok) {
        const transactions = await transRes.json()
        const projects = await projectsRes.json()

        // 计算外账统计（报税用）
        // 外账：只有公司发票的支出
        const externalTrans = transactions.filter((t: any) => t.accountType === "external")

        const externalIncome = externalTrans.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0)
        const externalExpense = externalTrans.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0)

        const stats: OverallStats = {
          totalIncome: externalIncome,
          totalExpense: externalExpense,
          internalIncome: 0,
          internalExpense: 0,
          externalIncome,
          externalExpense,
          totalSalary: 0,
          projectCount: projects.length,
          userCount: 0,
        }

        if (salariesRes.ok) {
          const salaries = await salariesRes.json()
          stats.totalSalary = salaries.reduce((sum: number, s: any) => sum + s.total, 0)
        }

        if (usersRes.ok) {
          const users = await usersRes.json()
          stats.userCount = users.length
        }

        setOverallStats(stats)

        // 计算每个项目的外账统计（报税用）
        const projectStatsData: ProjectStats[] = projects.map((project: Project) => {
          const projectTrans = transactions.filter((t: any) => t.projectId === project.id)
          const externalProjectTrans = projectTrans.filter((t: any) => t.accountType === "external")

          const projectExternalIncome = externalProjectTrans.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0)
          const projectExternalExpense = externalProjectTrans.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0)

          return {
            project,
            internalExpense: 0,  // 不显示内账
            externalExpense: projectExternalExpense,
            totalExpenses: projectExternalExpense,
            transactionCount: projectTrans.length,
          }
        })

        setProjectStats(projectStatsData)
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">财务报表</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 总体统计 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">外账报表（报税用）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">外账收入</div>
              <div className="text-2xl font-bold text-green-600">¥{overallStats.totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">外账支出</div>
              <div className="text-2xl font-bold text-red-600">¥{overallStats.totalExpense.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">净额</div>
              <div className={`text-2xl font-bold ${overallStats.totalIncome - overallStats.totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
                ¥{(overallStats.totalIncome - overallStats.totalExpense).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">工资总额</div>
              <div className="text-2xl font-bold text-blue-600">¥{overallStats.totalSalary.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">
                项目：{overallStats.projectCount} | 用户：{overallStats.userCount}
              </div>
            </div>
          </div>
        </div>

        {/* 项目统计 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目明细</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500">
                <div>项目名称</div>
                <div className="text-right">外账支出</div>
                <div className="text-right">记录数</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {projectStats.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">暂无项目</div>
              ) : (
                projectStats.map((stat) => (
                  <div key={stat.project.id} className="px-6 py-4">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="font-medium text-gray-900">{stat.project.name}</div>
                        {stat.project.description && (
                          <div className="text-sm text-gray-500">{stat.project.description}</div>
                        )}
                      </div>
                      <div className="text-right font-bold text-blue-600">¥{stat.totalExpenses.toFixed(2)}</div>
                      <div className="text-right text-gray-500">{stat.transactionCount}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
