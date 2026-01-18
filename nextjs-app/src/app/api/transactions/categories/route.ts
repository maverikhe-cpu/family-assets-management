import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"
import { nanoid } from "nanoid"

/**
 * 获取交易分类列表
 * GET /api/transactions/categories
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, session.user.familyId)

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // income, expense
    const parentId = searchParams.get("parentId")

    const where: any = {
      familyId: session.user.familyId,
    }

    if (type) {
      where.type = type
    }

    if (parentId === "null" || parentId === "") {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    }

    const categories = await prisma.transactionCategory.findMany({
      where,
      include: {
        children: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { order: "asc" },
    })

    return apiSuccess({ categories })
  } catch (error) {
    console.error("Get transaction categories error:", error)
    return apiError((error as Error).message || "获取交易分类失败", 500)
  }
}

/**
 * 创建交易分类
 * POST /api/transactions/categories
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const {
      name,
      type,
      parentId,
      icon = "📁",
      color = "#999999",
      isBuiltin = false,
      order = 0,
    } = body

    if (!name || !type) {
      return apiError("分类名称和类型必填")
    }

    if (!["income", "expense"].includes(type)) {
      return apiError("无效的分类类型")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, session.user.familyId)

    if (!access.canEdit) {
      return apiError("无权限创建分类", 403)
    }

    // 如果有父分类，验证它存在且属于当前家庭
    if (parentId) {
      const parent = await prisma.transactionCategory.findFirst({
        where: { id: parentId, familyId: session.user.familyId },
      })

      if (!parent) {
        return apiError("父分类不存在")
      }
    }

    const category = await prisma.transactionCategory.create({
      data: {
        id: nanoid(),
        name,
        type,
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
    console.error("Create transaction category error:", error)
    return apiError((error as Error).message || "创建交易分类失败", 500)
  }
}
