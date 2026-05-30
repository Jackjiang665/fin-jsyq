"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ImageModal from "@/components/ImageModal"

interface Expense {
  id: string
  amount: number
  description: string
  status: string
  fundSource: string
  hasInvoice: boolean
  invoiceType: string | null
  invoiceNote: string | null
  account: string
  invoiceImage: string | null
  receiptImage: string | null
  paymentImage: string | null
  rejectReason: string | null
  createdAt: string
  updatedAt: string
  project?: { id: string; name: string }
  submitter?: { id: string; name: string; nickname: string | null }
  approver?: { name: string; nickname: string | null }
}

interface Project {
  id: string
  name: string
}

interface Submitter {
  id: string
  name: string
  nickname: string | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function ApprovalHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  // 筛选和分页状态
  const [projects, setProjects] = useState<Project[]>([])
  const [submitters, setSubmitters] = useState<Submitter[]>([])
  const [filters, setFilters] = useState({
    projectId: "",
    submitterId: "",
    status: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.role !== "admin" && session?.user?.role !== "finance") {
      router.push("/")
    }
    fetchProjects()
    fetchSubmitters()
  }, [session, status, router])

  useEffect(() => {
    fetchExpenses()
  }, [filters, pagination.page])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchSubmitters = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setSubmitters(data)
      }
    } catch (error) {
      console.error("Failed to fetch submitters:", error)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        scope: "all",
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.submitterId && { submitterId: filters.submitterId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      })

      const res = await fetch(`/api/expenses/paginated?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}/pay`, {
        method: "POST",
      })

      if (res.ok) {
        setMessage("已标记为已打款！")
        fetchExpenses()
      } else {
        const data = await res.json()
        setMessage(data.error || "操作失败")
      }
    } catch {
      setMessage("操作失败，请重试")
    }
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
              <h1 className="text-xl font-bold text-gray-900">审批记录</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-3 rounded mb-4 ${message.includes("成功") || message.includes("已打款") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        {/* 筛选表单 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索描述</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="输入关键词搜索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目</label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange("projectId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提交人</label>
              <select
                value={filters.submitterId}
                onChange={(e) => handleFilterChange("submitterId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部人员</option>
                {submitters.map((submitter) => (
                  <option key={submitter.id} value={submitter.id}>
                    {submitter.nickname || submitter.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="paid">已打款</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <button
              onClick={() => {
                setFilters({ projectId: "", submitterId: "", status: "all", search: "", dateFrom: "", dateTo: "" })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              清除筛选
            </button>
            <span className="text-sm text-gray-500">
              共 {pagination.total} 条记录
            </span>
          </div>
        </div>

        {/* 记录列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">审批记录</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">加载中...</div>
            ) : expenses.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无记录</div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        提交人：{expense.submitter?.nickname || expense.submitter?.name} |
                        项目：{expense.project?.name} |
                        提交时间：{new Date(expense.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        资金来源：{expense.fundSource === "personal" ? "个人垫付" : "公司采购"} |
                        {expense.hasInvoice ? (
                          <>
                            有发票：
                            {expense.invoiceType === "company" ? "公司发票" : `其他单位发票${expense.invoiceNote ? `（${expense.invoiceNote}）` : ""}`}
                          </>
                        ) : "无发票"} |
                        支付账户：{expense.account === "public" ? "公户" : "支付宝"}
                      </div>
                      {expense.approver && (
                        <div className="text-sm text-gray-500 mt-1">
                          审批人：{expense.approver.nickname || expense.approver.name} |
                          审批时间：{new Date(expense.updatedAt).toLocaleDateString("zh-CN")}
                        </div>
                      )}
                      {expense.status === "rejected" && expense.rejectReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          拒绝原因：{expense.rejectReason}
                        </div>
                      )}

                      {/* 图片预览 */}
                      {(expense.invoiceImage || expense.receiptImage || expense.paymentImage) && (
                        <div className="mt-3 flex space-x-4">
                          {expense.invoiceImage && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">发票图片</div>
                              <ImageModal src={expense.invoiceImage} alt="发票" />
                            </div>
                          )}
                          {expense.receiptImage && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">购物截图</div>
                              <ImageModal src={expense.receiptImage} alt="购物截图" />
                            </div>
                          )}
                          {expense.paymentImage && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">支付明细</div>
                              <ImageModal src={expense.paymentImage} alt="支付明细" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(expense.status)}`}>
                        {getStatusName(expense.status)}
                      </span>
                      <div className="text-lg font-bold text-blue-600">¥{expense.amount.toFixed(2)}</div>
                      {expense.status === "approved" && (
                        <button
                          onClick={() => handlePay(expense.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          标记打款
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      pagination.page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </nav>
          </div>
        )}
      </main>
    </div>
  )
}
