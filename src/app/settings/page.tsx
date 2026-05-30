"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.name) {
      setNickname(session.user.name)
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/user/nickname", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessage("昵称更新成功！请重新登录以生效。")
        // 延迟后跳转到登录页
        setTimeout(() => {
          window.location.href = "/login"
        }, 1500)
      } else {
        setMessage("更新失败，请重试")
      }
    } catch {
      setMessage("更新失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
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
              <h1 className="text-xl font-bold text-gray-900">个人设置</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">修改昵称</h2>

          {message && (
            <div className={`p-3 rounded mb-4 ${message.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                真实姓名（不可修改）
              </label>
              <input
                type="text"
                value={(session?.user as { realName?: string })?.realName || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">此信息仅财务和管理员可见</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                显示昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入昵称"
              />
              <p className="text-xs text-gray-500 mt-1">其他用户看到的名称</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存修改"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
