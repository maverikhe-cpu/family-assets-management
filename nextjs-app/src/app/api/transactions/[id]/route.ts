import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 获取单个交易详情
 * GET /api/transactions/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
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

    if (!transaction) {
      return apiError("交易不存在", 404)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, transaction.familyId)

    return apiSuccess({ transaction })
  } catch (error) {
    console.error("Get transaction error:", error)
    return apiError((error as Error).message || "获取交易详情失败", 500)
  }
}

/**
 * 更新交易
 * PATCH /api/transactions/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

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

    // 检查交易是否存在
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction) {
      return apiError("交易不存在", 404)
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, transaction.familyId)

    if (!access.canEdit) {
      return apiError("无权限编辑交易", 403)
    }

    // 如果更改分类，验证新分类
    if (categoryId && categoryId !== transaction.categoryId) {
      const category = await prisma.transactionCategory.findFirst({
        where: { id: categoryId, familyId: session.user.familyId },
      })

      if (!category) {
        return apiError("交易分类不存在")
      }
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(amount !== undefined && { amount }),
        ...(categoryId && { categoryId }),
        ...(accountId && { accountId }),
        ...(memberId && { memberId }),
        ...(date && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(relatedAssetId !== undefined && { relatedAssetId }),
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

    return apiSuccess({ transaction: updatedTransaction })
  } catch (error) {
    console.error("Update transaction error:", error)
    return apiError((error as Error).message || "更新交易失败", 500)
  }
}

/**
 * 删除交易
 * DELETE /api/transactions/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 检查交易是否存在
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction) {
      return apiError("交易不存在", 404)
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, transaction.familyId)

    if (!access.canEdit) {
      return apiError("无权限删除交易", 403)
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    })

    return apiSuccess({ message: "删除成功" })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return apiError((error as Error).message || "删除交易失败", 500)
  }
}
