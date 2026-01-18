import { NextRequest } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"
import { nanoid } from "nanoid"

/**
 * 获取交易列表
 * GET /api/transactions
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
    const type = searchParams.get("type")
    const categoryId = searchParams.get("categoryId")
    const memberId = searchParams.get("memberId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      familyId: session.user.familyId,
    }

    if (type) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (memberId) {
      where.memberId = memberId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ])

    return apiSuccess({
      transactions,
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return apiError((error as Error).message || "获取交易列表失败", 500)
  }
}

/**
 * 创建新交易
 * POST /api/transactions
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const {
      type,
      amount,
      categoryId,
      accountId,
      memberId,
      date,
      notes,
      tags,
      relatedAssetId,
    } = body

    // 验证必填字段
    if (!type || !amount || !categoryId || !accountId || !memberId || !date) {
      return apiError("缺少必填字段")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, session.user.familyId)

    if (!access.canEdit) {
      return apiError("无权限创建交易", 403)
    }

    // 验证分类属于当前家庭
    const category = await prisma.transactionCategory.findFirst({
      where: { id: categoryId, familyId: session.user.familyId },
    })

    if (!category) {
      return apiError("交易分类不存在")
    }

    const transaction = await prisma.transaction.create({
      data: {
        id: nanoid(),
        type,
        amount,
        categoryId,
        accountId,
        familyId: session.user.familyId,
        memberId,
        date: new Date(date),
        notes,
        tags: tags || [],
        relatedAssetId,
      },
      include: {
        category: true,
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return apiSuccess({ transaction }, 201)
  } catch (error) {
    console.error("Create transaction error:", error)
    return apiError((error as Error).message || "创建交易失败", 500)
  }
}
