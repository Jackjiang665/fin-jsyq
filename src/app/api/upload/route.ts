import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 })
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 })
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`
    const uploadDir = join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, uniqueName)

    // 确保上传目录存在
    const { mkdirSync, existsSync } = require("fs")
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    // 写入文件
    await writeFile(filePath, buffer)

    // 返回文件 URL
    const url = `/uploads/${uniqueName}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
