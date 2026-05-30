"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
}

interface ExternalReimbursement {
  id: string
  source: string
  amount: number
  status: string
  description: string | null
  receivedAt: string | null
  createdAt: string
  project: Project
}

export default function ExternalReimbursementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reimbursements, setReimbursements] = useState<ExternalReimbursement[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    source: "",
    amount: "",
    description: "",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin" && session?.user?.role !== "finance") {
      router.push("/")
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [reimbRes, projRes] = await Promise.all([
        fetch("/api/external-reimbursements"),
        fetch("/api/projects"),
      ])
      if (reimbRes.ok) {
        const data = await reimbRes.json()
        setReimbursements(data)
      }
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data)
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
      const res = await fetch("/api/external-reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (res.ok) {
        setMessage("外部回款记录添加成功！")
        setFormData({ projectId: "", source: "", amount: "", description: "" })
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

  const handleReceive = async (id: string) => {
    try {
      const res = await fetch(`/api/external-reimbursements/${id}/receive`, {
        method: "POST",
      })

      if (res.ok) {
        setMessage("已标记为已回款！")
        fetchData()
      } else {
        setMessage("操作失败")
      }
    } catch {
      setMessage("操作失败，请重试")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return

    try {
      const res = await fetch(`/api/external-reimbursements/${id}`, {
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

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  const totalPending = reimbursements
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)
  const totalReceived = reimbursements
    .filter((r) => r.status === "received")
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">外部回款管理</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showForm ? "取消" : "添加回款"}
            </button>
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
            <div className="text-sm text-gray-500">待回款金额</div>
            <div className="text-2xl font-bold text-orange-600">¥{totalPending.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{reimbursements.filter((r) => r.status === "pending").length} 笔</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">已回款金额</div>
            <div className="text-2xl font-bold text-green-600">¥{totalReceived.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{reimbursements.filter((r) => r.status === "received").length} 笔</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">总回款金额</div>
            <div className="text-2xl font-bold text-blue-600">¥{(totalPending + totalReceived).toFixed(2)}</div>
            <div className="text-xs text-gray-400">{reimbursements.length} 笔</div>
          </div>
        </div>

        {/* 添加表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">添加外部回款</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联项目</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">回款来源</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="如：学校、XX公司"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">回款金额</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
            <h2 className="text-lg font-semibold">外部回款记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reimbursements.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无记录</div>
            ) : (
              reimbursements.map((reimb) => (
                <div key={reimb.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {reimb.project.name} - {reimb.source}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reimb.description && `${reimb.description} | `}
                      添加时间：{new Date(reimb.createdAt).toLocaleDateString("zh-CN")}
                      {reimb.receivedAt && ` | 回款时间：${new Date(reimb.receivedAt).toLocaleDateString("zh-CN")}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      reimb.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {reimb.status === "pending" ? "待回款" : "已回款"}
                    </span>
                    <div className="text-lg font-bold text-blue-600">¥{reimb.amount.toFixed(2)}</div>
                    <div className="flex space-x-2">
                      {reimb.status === "pending" && (
                        <button
                          onClick={() => handleReceive(reimb.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          标记已回款
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reimb.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
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
