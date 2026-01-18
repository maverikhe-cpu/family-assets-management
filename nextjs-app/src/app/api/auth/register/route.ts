import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

/**
 * 注册新用户
 * POST /api/auth/register
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    // 验证输入
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱、密码和姓名必填" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "邮箱已被注册" },
        { status: 400 }
      )
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = nanoid()

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        name,
        role: "editor",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        familyId: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        user,
        message: "注册成功",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    )
  }
}
