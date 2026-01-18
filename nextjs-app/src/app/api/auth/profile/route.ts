import { NextRequest, NextResponse } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 获取当前用户信息
 * GET /api/auth/profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 获取家庭角色
    let familyRole = null
    if (user.familyId) {
      const familyMember = await prisma.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: user.familyId,
            userId: user.id,
          },
        },
      })
      familyRole = familyMember?.role ?? null
    }

    return NextResponse.json({
      ...user,
      familyRole,
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    )
  }
}
