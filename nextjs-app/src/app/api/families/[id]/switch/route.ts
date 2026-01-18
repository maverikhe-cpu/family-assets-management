import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 切换当前家庭
 * POST /api/families/[id]/switch
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    // 验证是否是成员
    const access = await validateFamilyAccess(session.user.id, params.id)

    // 更新用户的当前家庭
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: params.id },
    })

    return apiSuccess({
      familyId: params.id,
      familyRole: access.member.role,
      message: "切换成功",
    })
  } catch (error) {
    console.error("Switch family error:", error)
    return apiError((error as Error).message || "切换家庭失败", 500)
  }
}
