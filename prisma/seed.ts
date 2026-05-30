import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员账号
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '张三',
      nickname: '管理员',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    },
  })

  // 创建测试财务账号
  const financePassword = await bcrypt.hash('finance123', 10)
  const finance = await prisma.user.upsert({
    where: { email: 'finance@example.com' },
    update: {},
    create: {
      name: '李四',
      nickname: '财务部长',
      email: 'finance@example.com',
      password: financePassword,
      role: 'finance',
    },
  })

  // 创建测试董事账号
  const directorPassword = await bcrypt.hash('director123', 10)
  const director = await prisma.user.upsert({
    where: { email: 'director@example.com' },
    update: {},
    create: {
      name: '王五',
      nickname: '董事',
      email: 'director@example.com',
      password: directorPassword,
      role: 'director',
    },
  })

  // 创建测试员工账号
  const employeePassword = await bcrypt.hash('employee123', 10)
  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      name: '赵六',
      nickname: '小赵',
      email: 'employee@example.com',
      password: employeePassword,
      role: 'employee',
    },
  })

  // 创建测试项目
  const project = await prisma.project.upsert({
    where: { name: '无人机项目' },
    update: {},
    create: {
      name: '无人机项目',
      description: '高中生无人机课程项目',
    },
  })

  console.log({ admin, finance, director, employee, project })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
