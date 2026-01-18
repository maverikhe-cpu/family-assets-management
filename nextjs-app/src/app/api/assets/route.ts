import { NextRequest } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"
import { nanoid } from "nanoid"

/**
 * 获取家庭资产列表
 * GET /api/assets
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 验证家庭访问权限
    await validateFamilyAccess(session.user.id, session.user.familyId)

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const holderId = searchParams.get("holderId")
    const status = searchParams.get("status")
    const searchTerm = searchParams.get("search")

    const where: any = {
      familyId: session.user.familyId,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (holderId) {
      where.holderId = holderId
    }

    if (status) {
      where.status = status
    }

    if (searchTerm) {
      where.name = { contains: searchTerm, mode: "insensitive" }
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        holder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return apiSuccess({ assets })
  } catch (error) {
    console.error("Get assets error:", error)
    return apiError((error as Error).message || "获取资产列表失败", 500)
  }
}

/**
 * 创建新资产
 * POST /api/assets
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const {
      name,
      categoryId,
      holderId,
      initialValue,
      currentValue,
      currency = "CNY",
      purchaseDate,
      status = "active",
      attributes,
      notes,
    } = body

    // 验证必填字段
    if (!name || !categoryId || !holderId || !initialValue || !purchaseDate) {
      return apiError("缺少必填字段")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, session.user.familyId)

    if (!access.canEdit) {
      return apiError("无权限创建资产", 403)
    }

    // 验证分类属于当前家庭
    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, familyId: session.user.familyId },
    })

    if (!category) {
      return apiError("资产分类不存在")
    }

    const asset = await prisma.asset.create({
      data: {
        id: nanoid(),
        name,
        categoryId,
        familyId: session.user.familyId,
        holderId,
        initialValue,
        currentValue: currentValue || initialValue,
        currency,
        purchaseDate: new Date(purchaseDate),
        status,
        attributes,
        notes,
      },
      include: {
        category: true,
        holder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return apiSuccess({ asset }, 201)
  } catch (error) {
    console.error("Create asset error:", error)
    return apiError((error as Error).message || "创建资产失败", 500)
  }
}
