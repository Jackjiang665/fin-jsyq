import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as { name?: string; role?: string; realName?: string }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">财务管理系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.name}</span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user.role === "admin" && "管理员"}
                {user.role === "finance" && "财务"}
                {user.role === "director" && "董事"}
                {user.role === "employee" && "员工"}
              </span>
              <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-800">
                ⚙️ 设置
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来，{user.name}</h2>
          <p className="text-gray-600">今天是 {new Date().toLocaleDateString("zh-CN")}</p>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 员工功能 */}
          <Link href="/expenses/new" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-900">提交报销</h3>
              <p className="text-sm text-gray-600">提交新的报销申请</p>
            </div>
          </Link>

          <Link href="/expenses" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-gray-900">我的报销</h3>
              <p className="text-sm text-gray-600">查看报销记录和状态</p>
            </div>
          </Link>

          <Link href="/salary" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-900">我的工资</h3>
              <p className="text-sm text-gray-600">查看工资明细</p>
            </div>
          </Link>

          {/* 管理功能 */}
          {(user.role === "admin" || user.role === "finance") && (
            <>
              <Link href="/finance/approvals" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-semibold text-gray-900">报销审批</h3>
                  <p className="text-sm text-gray-600">审批员工报销申请</p>
                </div>
              </Link>

              <Link href="/finance/approval-history" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">📜</div>
                  <h3 className="font-semibold text-gray-900">审批记录</h3>
                  <p className="text-sm text-gray-600">查看历史审批记录</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* 管理员和财务专用 */}
        {(user.role === "admin" || user.role === "finance" || user.role === "director") && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">财务管理</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/finance/internal" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900">内账管理</h3>
                  <p className="text-sm text-gray-600">成本核算和补贴</p>
                </div>
              </Link>

              <Link href="/finance/external" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <h3 className="font-semibold text-gray-900">外账管理</h3>
                  <p className="text-sm text-gray-600">报税用收支记录</p>
                </div>
              </Link>

              {(user.role === "admin" || user.role === "finance") && (
                <Link href="/finance/salary" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💵</div>
                    <h3 className="font-semibold text-gray-900">工资管理</h3>
                    <p className="text-sm text-gray-600">录入员工工资</p>
                  </div>
                </Link>
              )}

              <Link href="/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">📉</div>
                  <h3 className="font-semibold text-gray-900">财务报表</h3>
                  <p className="text-sm text-gray-600">查看统计报表</p>
                </div>
              </Link>

              <Link href="/finance/external-reimbursement" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <h3 className="font-semibold text-gray-900">外部回款</h3>
                  <p className="text-sm text-gray-600">管理学校/其他单位回款</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* 管理员专用 */}
        {user.role === "admin" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">系统管理</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/projects" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">📁</div>
                  <h3 className="font-semibold text-gray-900">项目管理</h3>
                  <p className="text-sm text-gray-600">创建和管理项目</p>
                </div>
              </Link>

              <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="font-semibold text-gray-900">用户管理</h3>
                  <p className="text-sm text-gray-600">创建账号、分配角色</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
