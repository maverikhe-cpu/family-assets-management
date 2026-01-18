import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"
import { nanoid } from "nanoid"

/**
 * 获取资产分类列表
 * GET /api/assets/categories
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, session.user.familyId)

    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get("parentId")

    const where: any = {
      familyId: session.user.familyId,
    }

    if (parentId === "null" || parentId === "") {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    }

    const categories = await prisma.assetCategory.findMany({
      where,
      include: {
        children: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { order: "asc" },
    })

    return apiSuccess({ categories })
  } catch (error) {
    console.error("Get asset categories error:", error)
    return apiError((error as Error).message || "获取资产分类失败", 500)
  }
}

/**
 * 创建资产分类
 * POST /api/assets/categories
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
      parentId,
      icon = "📁",
      color = "#999999",
      isBuiltin = false,
      order = 0,
    } = body

    if (!name) {
      return apiError("分类名称必填")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, session.user.familyId)

    if (!access.canEdit) {
      return apiError("无权限创建分类", 403)
    }

    // 如果有父分类，验证它存在且属于当前家庭
    if (parentId) {
      const parent = await prisma.assetCategory.findFirst({
        where: { id: parentId, familyId: session.user.familyId },
      })

      if (!parent) {
        return apiError("父分类不存在")
      }
    }

    const category = await prisma.assetCategory.create({
      data: {
        id: nanoid(),
        name,
        parentId,
        familyId: session.user.familyId,
        icon,
        color,
        isBuiltin,
        order,
      },
    })

    return apiSuccess({ category }, 201)
  } catch (error) {
    console.error("Create asset category error:", error)
    return apiError((error as Error).message || "创建资产分类失败", 500)
  }
}
