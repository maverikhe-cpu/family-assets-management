import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 获取单个资产详情
 * GET /api/assets/[id]
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

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        holder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        changes: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    })

    if (!asset) {
      return apiError("资产不存在", 404)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, asset.familyId)

    return apiSuccess({ asset })
  } catch (error) {
    console.error("Get asset error:", error)
    return apiError((error as Error).message || "获取资产详情失败", 500)
  }
}

/**
 * 更新资产
 * PATCH /api/assets/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      currency,
      purchaseDate,
      status,
      attributes,
      notes,
    } = body

    // 检查资产是否存在
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      return apiError("资产不存在", 404)
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, asset.familyId)

    if (!access.canEdit) {
      return apiError("无权限编辑资产", 403)
    }

    // 如果更改分类，验证新分类
    if (categoryId && categoryId !== asset.categoryId) {
      const category = await prisma.assetCategory.findFirst({
        where: { id: categoryId, familyId: session.user.familyId },
      })

      if (!category) {
        return apiError("资产分类不存在")
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(holderId && { holderId }),
        ...(initialValue !== undefined && { initialValue }),
        ...(currentValue !== undefined && { currentValue }),
        ...(currency && { currency }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(status && { status }),
        ...(attributes !== undefined && { attributes }),
        ...(notes !== undefined && { notes }),
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

    return apiSuccess({ asset: updatedAsset })
  } catch (error) {
    console.error("Update asset error:", error)
    return apiError((error as Error).message || "更新资产失败", 500)
  }
}

/**
 * 删除资产
 * DELETE /api/assets/[id]
 */
export async function DELETE(
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
    const access = await validateFamilyAccess(session.user.id, asset.familyId)

    if (!access.canEdit) {
      return apiError("无权限删除资产", 403)
    }

    await prisma.asset.delete({
      where: { id },
    })

    return apiSuccess({ message: "删除成功" })
  } catch (error) {
    console.error("Delete asset error:", error)
    return apiError((error as Error).message || "删除资产失败", 500)
  }
}
