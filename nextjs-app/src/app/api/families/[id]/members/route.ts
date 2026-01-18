import { NextRequest, NextResponse } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 添加家庭成员
 * POST /api/families/[id]/members
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const { email, role = "member" } = body

    if (!email) {
      return apiError("邮箱必填")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, id)

    if (!access.canManage) {
      return apiError("无权限添加成员", 403)
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return apiError("用户不存在")
    }

    // 检查是否已是成员
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: id,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return apiError("用户已是家庭成员")
    }

    // 添加成员
    const member = await prisma.familyMember.create({
      data: {
        familyId: id,
        userId: user.id,
        role,
        invitedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return apiSuccess({ member, message: "添加成功" }, 201)
  } catch (error) {
    console.error("Add member error:", error)
    return apiError((error as Error).message || "添加成员失败", 500)
  }
}
