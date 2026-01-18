import { NextRequest, NextResponse } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 重新生成邀请码
 * POST /api/families/[id]/regenerate-invite-code
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

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, id)

    if (!access.canManage) {
      return apiError("无权限重新生成邀请码", 403)
    }

    const newInviteCode = nanoid(8).toUpperCase()

    const family = await prisma.family.update({
      where: { id },
      data: { inviteCode: newInviteCode },
      select: { inviteCode: true },
    })

    return apiSuccess({ inviteCode: family.inviteCode })
  } catch (error) {
    console.error("Regenerate invite code error:", error)
    return apiError((error as Error).message || "重新生成邀请码失败", 500)
  }
}
