import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiError, apiSuccess } from "@/lib/permissions"

/**
 * 通过邀请码加入家庭
 * POST /api/families/join/[inviteCode]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    // 查找家庭
    const family = await prisma.family.findUnique({
      where: { inviteCode: params.inviteCode },
    })

    if (!family) {
      return apiError("邀请码无效", 404)
    }

    // 检查是否已是成员
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: family.id,
          userId: session.user.id,
        },
      },
    })

    if (existingMember) {
      return apiError("您已经是该家庭成员")
    }

    // 添加为成员
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: session.user.id,
        role: "member",
      },
    })

    // 更新用户的当前家庭
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    })

    return apiSuccess({ family, message: "加入成功" })
  } catch (error) {
    console.error("Join family error:", error)
    return apiError("加入家庭失败", 500)
  }
}
