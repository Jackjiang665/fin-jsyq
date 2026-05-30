"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Salary {
  id: string
  year: number
  month: number
  baseSalary: number
  allowance: number
  deduction: number
  total: number
  note: string | null
  createdAt: string
}

export default function MySalaryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    fetchSalaries()
  }, [session, status, router])

  const fetchSalaries = async () => {
    try {
      const url = filterYear ? `/api/salaries?year=${filterYear}` : "/api/salaries"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSalaries(data)
      }
    } catch (error) {
      console.error("Failed to fetch salaries:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchSalaries()
    }
  }, [filterYear, session])

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
              <h1 className="text-xl font-bold text-gray-900">我的工资</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份筛选</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部</option>
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                累计工资：<span className="text-lg font-bold text-blue-600">¥{totalSalary.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 工资列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">工资明细</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {salaries.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">暂无工资记录</div>
            ) : (
              salaries.map((salary) => (
                <div key={salary.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">
                      {salary.year}年{salary.month}月
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ¥{salary.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">基本工资：</span>
                      <span className="font-medium">¥{salary.baseSalary.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">补贴：</span>
                      <span className="font-medium text-green-600">+¥{salary.allowance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">扣款：</span>
                      <span className="font-medium text-red-600">-¥{salary.deduction.toFixed(2)}</span>
                    </div>
                  </div>
                  {salary.note && (
                    <div className="mt-2 text-sm text-gray-500">
                      备注：{salary.note}
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
