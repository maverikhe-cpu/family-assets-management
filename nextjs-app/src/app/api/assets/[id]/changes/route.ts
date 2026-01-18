import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 获取资产变动记录
 * GET /api/assets/[id]/changes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 检查资产是否存在
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      return apiError("资产不存在", 404)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, asset.familyId)

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const [changes, total] = await Promise.all([
      prisma.assetChange.findMany({
        where: { assetId: id },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.assetChange.count({
        where: { assetId: id },
      }),
    ])

    return apiSuccess({
      changes,
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Get asset changes error:", error)
    return apiError((error as Error).message || "获取资产变动记录失败", 500)
  }
}
