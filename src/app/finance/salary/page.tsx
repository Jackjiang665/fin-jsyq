"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  nickname: string | null
  email: string
  role: string
}

interface Salary {
  id: string
  year: number
  month: number
  baseSalary: number
  allowance: number
  deduction: number
  total: number
  note: string | null
  user: User
}

export default function SalaryManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    baseSalary: "",
    allowance: "0",
    deduction: "0",
    note: "",
  })
  const [message, setMessage] = useState("")
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString())

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
      const [usersRes, salariesRes] = await Promise.all([
        fetch("/api/users"),
        fetch(`/api/salaries?year=${filterYear}&month=${filterMonth}`),
      ])
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
      if (salariesRes.ok) {
        const salariesData = await salariesRes.json()
        setSalaries(salariesData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "admin" || session?.user?.role === "finance") {
      fetch(`/api/salaries?year=${filterYear}&month=${filterMonth}`)
        .then((res) => res.json())
        .then((data) => setSalaries(data))
        .catch((error) => console.error("Failed to fetch salaries:", error))
    }
  }, [filterYear, filterMonth, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    const baseSalary = parseFloat(formData.baseSalary)
    const allowance = parseFloat(formData.allowance)
    const deduction = parseFloat(formData.deduction)

    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          baseSalary,
          allowance,
          deduction,
          total: baseSalary + allowance - deduction,
        }),
      })

      if (res.ok) {
        setMessage("工资记录添加成功！")
        setFormData({
          userId: "",
          year: new Date().getFullYear().toString(),
          month: (new Date().getMonth() + 1).toString(),
          baseSalary: "",
          allowance: "0",
          deduction: "0",
          note: "",
        })
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
    if (!confirm("确定要删除这条工资记录吗？")) return

    try {
      const res = await fetch(`/api/salaries/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setMessage("工资记录删除成功！")
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

  const totalSalary = salaries.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">工资管理</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showForm ? "取消" : "录入工资"}
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

        {/* 筛选 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月份</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                工资总额：<span className="text-lg font-bold text-blue-600">¥{totalSalary.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 录入表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">录入工资</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">员工</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择员工</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nickname || u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年月</label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>{month}月</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">基本工资</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">补贴</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.allowance}
                    onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">扣款</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deduction}
                    onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                录入工资
              </button>
            </form>
          </div>
        )}

        {/* 工资列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{filterYear}年{filterMonth}月工资记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {salaries.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无工资记录</div>
            ) : (
              salaries.map((salary) => (
                <div key={salary.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {salary.user.nickname || salary.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      基本工资：¥{salary.baseSalary.toFixed(2)} |
                      补贴：¥{salary.allowance.toFixed(2)} |
                      扣款：¥{salary.deduction.toFixed(2)}
                      {salary.note && ` | ${salary.note}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-bold text-blue-600">
                      ¥{salary.total.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleDelete(salary.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
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
