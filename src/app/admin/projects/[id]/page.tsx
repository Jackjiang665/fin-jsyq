"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"

interface Project {
  id: string
  name: string
  description: string | null
  expenses: any[]
  transactions: any[]
}

export default function ProjectDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [session, status, router, params.id])

  const fetchProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">项目不存在</div>
  }

  // 计算统计数据
  const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalTransactions = project.transactions.reduce((sum, t) => sum + t.amount, 0)
  const internalTransactions = project.transactions.filter((t) => t.accountType === "internal")
  const externalTransactions = project.transactions.filter((t) => t.accountType === "external")
  const internalTotal = internalTransactions.reduce((sum, t) => sum + t.amount, 0)
  const externalTotal = externalTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/admin/projects")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回项目列表
              </button>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 项目信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">项目信息</h2>
          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">报销总额</div>
            <div className="text-2xl font-bold text-blue-600">¥{totalExpenses.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{project.expenses.length} 笔报销</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">内账支出</div>
            <div className="text-2xl font-bold text-green-600">¥{internalTotal.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{internalTransactions.length} 笔记录</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">外账支出</div>
            <div className="text-2xl font-bold text-orange-600">¥{externalTotal.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{externalTransactions.length} 笔记录</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">总记录数</div>
            <div className="text-2xl font-bold text-purple-600">{project.transactions.length}</div>
            <div className="text-xs text-gray-400">账目记录</div>
          </div>
        </div>

        {/* 报销记录 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">报销记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {project.expenses.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无报销记录</div>
            ) : (
              project.expenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        提交人：{expense.submitter?.name || "未知"} |
                        状态：{expense.status === "pending" ? "待审批" : expense.status === "approved" ? "已通过" : expense.status === "rejected" ? "已拒绝" : "已打款"}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">¥{expense.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 账目记录 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">账目记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {project.transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无账目记录</div>
            ) : (
              project.transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        类型：{transaction.type === "income" ? "收入" : "支出"} |
                        分类：{transaction.category} |
                        账套：{transaction.accountType === "internal" ? "内账" : "外账"}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}¥{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
