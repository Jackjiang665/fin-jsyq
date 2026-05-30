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
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    role: "employee",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin") {
      router.push("/")
    }
    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setMessage("用户创建成功！")
        setFormData({ name: "", nickname: "", email: "", password: "", role: "employee" })
        setShowForm(false)
        fetchUsers()
      } else {
        const data = await res.json()
        setMessage(data.error || "创建失败")
      }
    } catch {
      setMessage("创建失败，请重试")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个用户吗？")) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setMessage("用户删除成功！")
        fetchUsers()
      } else {
        const data = await res.json()
        setMessage(data.error || "删除失败")
      }
    } catch {
      setMessage("删除失败，请重试")
    }
  }

  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      admin: "管理员",
      finance: "财务",
      director: "董事",
      employee: "员工",
    }
    return names[role] || role
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
              <h1 className="text-xl font-bold text-gray-900">用户管理</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showForm ? "取消" : "新建用户"}
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

        {/* 新建用户表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">新建用户</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">昵称（可选）</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">员工</option>
                    <option value="finance">财务</option>
                    <option value="director">董事</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                创建用户
              </button>
            </form>
          </div>
        )}

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">用户列表</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无用户</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.nickname || user.name}
                      {user.nickname && <span className="text-gray-500 ml-2">({user.name})</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email} | {getRoleName(user.role)} | 创建于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === "admin" ? "bg-red-100 text-red-800" :
                      user.role === "finance" ? "bg-blue-100 text-blue-800" :
                      user.role === "director" ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                    {user.id !== session?.user?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
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
