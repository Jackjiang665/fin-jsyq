"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Expense {
  id: string
  amount: number
  description: string
  status: string
  rejectReason: string | null
  isHighAmount: boolean
  createdAt: string
  project?: { name: string }
}

export default function MyExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    fetchExpenses()
  }, [session, status, router])

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses")
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      pending: "待审批",
      approved: "已通过",
      rejected: "已拒绝",
      paid: "已打款",
    }
    return names[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      paid: "bg-blue-100 text-blue-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingAmount = expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0)
  const approvedAmount = expenses.filter((e) => e.status === "approved" || e.status === "paid").reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">我的报销</h1>
            </div>
            <button
              onClick={() => router.push("/expenses/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              提交报销
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">总报销金额</div>
            <div className="text-2xl font-bold text-blue-600">¥{totalAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{expenses.length} 笔记录</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">待审批金额</div>
            <div className="text-2xl font-bold text-yellow-600">¥{pendingAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{expenses.filter((e) => e.status === "pending").length} 笔</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">已通过金额</div>
            <div className="text-2xl font-bold text-green-600">¥{approvedAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{expenses.filter((e) => e.status === "approved" || e.status === "paid").length} 笔</div>
          </div>
        </div>

        {/* 报销列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">报销记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无报销记录，点击"提交报销"开始
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        {expense.project?.name || "无项目"} | {new Date(expense.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(expense.status)}`}>
                        {getStatusName(expense.status)}
                      </span>
                      <div className="text-lg font-bold text-blue-600">¥{expense.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  {expense.status === "rejected" && expense.rejectReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      拒绝原因：{expense.rejectReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
