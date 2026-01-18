import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 获取家庭详情
 * GET /api/families/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!family) {
      return apiError("家庭不存在", 404)
    }

    // 验证访问权限
    const access = await validateFamilyAccess(session.user.id, family.id)

    return apiSuccess({
      ...family,
      currentRole: access.member.role,
    })
  } catch (error) {
    console.error("Get family error:", error)
    return apiError((error as Error).message || "获取家庭详情失败", 500)
  }
}

/**
 * 更新家庭信息
 * PUT /api/families/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const { name, description } = body

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, id)

    if (!access.canManage) {
      return apiError("无权限编辑家庭信息", 403)
    }

    const family = await prisma.family.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    })

    return apiSuccess({ family })
  } catch (error) {
    console.error("Update family error:", error)
    return apiError((error as Error).message || "更新家庭信息失败", 500)
  }
}

/**
 * 删除家庭
 * DELETE /api/families/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    // 验证权限 - 只有 owner 可以删除
    const access = await validateFamilyAccess(session.user.id, id)

    if (!access.isOwner) {
      return apiError("只有家庭所有者可以删除家庭", 403)
    }

    await prisma.family.delete({
      where: { id },
    })

    // 更新用户的当前家庭
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: null },
    })

    return apiSuccess({ message: "删除成功" })
  } catch (error) {
    console.error("Delete family error:", error)
    return apiError((error as Error).message || "删除家庭失败", 500)
  }
}
