"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin") {
      router.push("/")
    }
    fetchProjects()
  }, [session, status, router])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setMessage("项目创建成功！")
        setFormData({ name: "", description: "" })
        setShowForm(false)
        fetchProjects()
      } else {
        const data = await res.json()
        setMessage(data.error || "创建失败")
      }
    } catch {
      setMessage("创建失败，请重试")
    }
  }

  const handleClose = async (id: string) => {
    if (!confirm("确定要封账这个项目吗？封账后不能再提交报销。")) return

    try {
      const res = await fetch(`/api/projects/${id}/close`, {
        method: "POST",
      })

      if (res.ok) {
        setMessage("项目已封账！")
        fetchProjects()
      } else {
        const data = await res.json()
        setMessage(data.error || "封账失败")
      }
    } catch {
      setMessage("封账失败，请重试")
    }
  }

  const handleReopen = async (id: string) => {
    if (!confirm("确定要重新打开这个项目吗？")) return

    try {
      const res = await fetch(`/api/projects/${id}/reopen`, {
        method: "POST",
      })

      if (res.ok) {
        setMessage("项目已重新打开！")
        fetchProjects()
      } else {
        const data = await res.json()
        setMessage(data.error || "打开失败")
      }
    } catch {
      setMessage("打开失败，请重试")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个项目吗？")) return

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setMessage("项目删除成功！")
        fetchProjects()
      } else {
        const data = await res.json()
        setMessage(data.error || "删除失败")
      }
    } catch {
      setMessage("删除失败，请重试")
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
              <h1 className="text-xl font-bold text-gray-900">项目管理</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showForm ? "取消" : "新建项目"}
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

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">新建项目</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">项目描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                创建项目
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">项目列表</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无项目，点击"新建项目"创建第一个项目
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {project.status === "active" ? "进行中" : "已封账"}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      创建时间：{new Date(project.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/projects/${project.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      查看详情
                    </button>
                    {project.status === "active" ? (
                      <button
                        onClick={() => handleClose(project.id)}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        封账
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopen(project.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        重新打开
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(project.id)}
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
