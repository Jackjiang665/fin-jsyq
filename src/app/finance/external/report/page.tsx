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
  income: number
  expense: number
  net: number
}

export default function ExternalReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

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
      const [transRes, projectsRes] = await Promise.all([
        fetch("/api/transactions?type=external"),
        fetch("/api/projects"),
      ])

      if (transRes.ok && projectsRes.ok) {
        const transactions = await transRes.json()
        const projects = await projectsRes.json()

        // 计算总体统计
        const income = transactions.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0)
        const expense = transactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0)
        setTotalIncome(income)
        setTotalExpense(expense)

        // 计算每个项目的统计
        const stats: ProjectStats[] = projects.map((project: Project) => {
          const projectTrans = transactions.filter((t: any) => t.projectId === project.id)
          const projectIncome = projectTrans.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0)
          const projectExpense = projectTrans.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0)

          return {
            project,
            income: projectIncome,
            expense: projectExpense,
            net: projectIncome - projectExpense,
          }
        })

        setProjectStats(stats)
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
              <button onClick={() => router.push("/finance/external")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回外账管理
              </button>
              <h1 className="text-xl font-bold text-gray-900">外账报表（报税用）</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 总体统计 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">总体概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">外账收入</div>
              <div className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">外账支出</div>
              <div className="text-2xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">净额</div>
              <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
                ¥{(totalIncome - totalExpense).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 项目明细 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目明细</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                <div>项目名称</div>
                <div className="text-right">收入</div>
                <div className="text-right">支出</div>
                <div className="text-right">净额</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {projectStats.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">暂无项目</div>
              ) : (
                projectStats.map((stat) => (
                  <div key={stat.project.id} className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div>
                        <div className="font-medium text-gray-900">{stat.project.name}</div>
                        {stat.project.description && (
                          <div className="text-sm text-gray-500">{stat.project.description}</div>
                        )}
                      </div>
                      <div className="text-right text-green-600">¥{stat.income.toFixed(2)}</div>
                      <div className="text-right text-red-600">¥{stat.expense.toFixed(2)}</div>
                      <div className={`text-right font-bold ${stat.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ¥{stat.net.toFixed(2)}
                      </div>
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
