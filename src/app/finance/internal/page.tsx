"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  accountType: string
  createdAt: string
  project?: { name: string }
}

interface Project {
  id: string
  name: string
}

export default function InternalFinancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: "expense",
    category: "purchase",
    amount: "",
    description: "",
    projectId: "",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin" && session?.user?.role !== "finance" && session?.user?.role !== "director") {
      router.push("/")
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [transRes, projRes] = await Promise.all([
        fetch("/api/transactions?type=internal"),
        fetch("/api/projects"),
      ])
      if (transRes.ok) {
        const transData = await transRes.json()
        setTransactions(transData)
      }
      if (projRes.ok) {
        const projData = await projRes.json()
        setProjects(projData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          accountType: "internal",
        }),
      })

      if (res.ok) {
        setMessage("记录添加成功！")
        setFormData({ type: "expense", category: "purchase", amount: "", description: "", projectId: "" })
        setShowForm(false)
        fetchData()
      } else {
        const data = await res.json()
        setMessage(data.error || "添加失败")
      }
    } catch {
      setMessage("添加失败，请重试")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setMessage("记录删除成功！")
        fetchData()
      } else {
        setMessage("删除失败")
      }
    } catch {
      setMessage("删除失败，请重试")
    }
  }

  const getExpenseCategoryName = (category: string) => {
    const names: Record<string, string> = {
      salary: "工资",
      purchase: "采购",
      reimbursement: "报销",
      other: "其他支出",
    }
    return names[category] || category
  }

  const getIncomeCategoryName = (category: string) => {
    const names: Record<string, string> = {
      business: "业务收入",
      subsidy: "补贴收入",
      investment: "投资收益",
      other: "其他收入",
    }
    return names[category] || category
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  // 计算总收入和总支出
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">内账管理</h1>
            </div>
            <button
              onClick={() => router.push("/finance/internal/report")}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              查看报表
            </button>
            {(session?.user?.role === "admin" || session?.user?.role === "finance") && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showForm ? "取消" : "添加记录"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-3 rounded mb-4 ${message.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">总收入</div>
            <div className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">总支出</div>
            <div className="text-2xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">净额</div>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
              ¥{(totalIncome - totalExpense).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 添加记录表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">添加内账记录</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {formData.type === "expense" ? (
                      <>
                        <option value="salary">工资</option>
                        <option value="purchase">采购</option>
                        <option value="reimbursement">报销</option>
                        <option value="other">其他支出</option>
                      </>
                    ) : (
                      <>
                        <option value="business">业务收入</option>
                        <option value="subsidy">补贴收入</option>
                        <option value="investment">投资收益</option>
                        <option value="other">其他收入</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">金额</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联项目</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">无</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                添加记录
              </button>
            </form>
          </div>
        )}

        {/* 记录列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">内账记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无记录</div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{t.description}</div>
                    <div className="text-sm text-gray-500">
                      {t.type === "income" ? getIncomeCategoryName(t.category) : getExpenseCategoryName(t.category)} | {t.project?.name || "无项目"} | {new Date(t.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`text-lg font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}¥{t.amount.toFixed(2)}
                    </div>
                    {(session?.user?.role === "admin" || session?.user?.role === "finance") && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    )}
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
