"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  status: string
}

export default function NewExpensePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    projectId: "",
    fundSource: "personal", // personal, company
    hasInvoice: true,
    invoiceType: "company", // company, other
    invoiceNote: "",
    invoiceImage: "",
    receiptImage: "",
    paymentImage: "",
  })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    fetchProjects()
  }, [session, status, router])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        // 只显示进行中的项目
        setProjects(data.filter((p: Project) => p.status === "active"))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: string) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, [type]: data.url }))
      } else {
        const data = await res.json()
        setMessage(data.error || "上传失败")
      }
    } catch {
      setMessage("上传失败，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: formData.description,
          projectId: formData.projectId,
          fundSource: formData.fundSource,
          hasInvoice: formData.hasInvoice,
          invoiceType: formData.hasInvoice ? formData.invoiceType : null,
          invoiceNote: formData.hasInvoice && formData.invoiceType === "other" ? formData.invoiceNote : null,
          invoiceImage: formData.invoiceImage || null,
          receiptImage: formData.receiptImage || null,
          paymentImage: formData.paymentImage || null,
        }),
      })

      if (res.ok) {
        setMessage("报销申请提交成功！")
        setTimeout(() => {
          router.push("/expenses")
        }, 1500)
      } else {
        const data = await res.json()
        setMessage(data.error || "提交失败")
      }
    } catch {
      setMessage("提交失败，请重试")
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
              <button onClick={() => router.push("/expenses")} className="text-blue-600 hover:text-blue-800 mr-4">
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">提交报销</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">报销申请</h2>

          {message && (
            <div className={`p-3 rounded mb-4 ${message.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">报销金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入金额"
                  required
                />
                {parseFloat(formData.amount) > 1000 && (
                  <p className="text-xs text-orange-500 mt-1">⚠️ 超过1000元需要董事长二次审批</p>
                )}
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">资金来源</label>
                <select
                  value={formData.fundSource}
                  onChange={(e) => setFormData({ ...formData, fundSource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="personal">个人垫付</option>
                  <option value="company">公司采购</option>
                </select>
              </div>

            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasInvoice}
                  onChange={(e) => setFormData({ ...formData, hasInvoice: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">有发票</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">有发票的支出会计入外账</p>
            </div>

            {formData.hasInvoice && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">发票类型</label>
                    <select
                      value={formData.invoiceType}
                      onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="company">公司发票</option>
                      <option value="other">其他单位发票</option>
                    </select>
                  </div>
                  {formData.invoiceType === "other" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">发票单位名称</label>
                      <input
                        type="text"
                        value={formData.invoiceNote}
                        onChange={(e) => setFormData({ ...formData, invoiceNote: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入开票单位名称"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">用途说明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="请详细说明报销用途"
                required
              />
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">附件上传（可选）</h3>
              <p className="text-xs text-gray-500 mb-2">发票图片、购物截图、支付明细等</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">发票图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, "invoiceImage")
                    }}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.invoiceImage && (
                    <img src={formData.invoiceImage} alt="发票预览" className="mt-2 w-20 h-20 object-cover rounded border" />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">购物截图</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, "receiptImage")
                    }}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.receiptImage && (
                    <img src={formData.receiptImage} alt="购物截图预览" className="mt-2 w-20 h-20 object-cover rounded border" />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">支付明细</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, "paymentImage")
                    }}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.paymentImage && (
                    <img src={formData.paymentImage} alt="支付明细预览" className="mt-2 w-20 h-20 object-cover rounded border" />
                  )}
                </div>
              </div>
              {uploading && <p className="text-xs text-blue-500 mt-2">上传中...</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              提交报销
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
