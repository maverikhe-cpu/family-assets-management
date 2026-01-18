import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 移除家庭成员
 * DELETE /api/families/[id]/members/[userId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, params.id)

    // 不能移除自己
    if (params.userId === session.user.id) {
      return apiError("不能移除自己，请使用退出家庭功能")
    }

    // 只有 owner/admin 可以移除成员
    if (!access.canManage) {
      return apiError("无权限移除成员", 403)
    }

    // 检查被移除用户的角色
    const targetMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: params.id,
          userId: params.userId,
        },
      },
    })

    if (!targetMember) {
      return apiError("成员不存在", 404)
    }

    // owner 不能被移除
    if (targetMember.role === "owner") {
      return apiError("不能移除家庭所有者")
    }

    // admin 只能被 owner 移除
    if (targetMember.role === "admin" && !access.isOwner) {
      return apiError("只有家庭所有者可以移除管理员", 403)
    }

    await prisma.familyMember.delete({
      where: {
        familyId_userId: {
          familyId: params.id,
          userId: params.userId,
        },
      },
    })

    return apiSuccess({ message: "移除成功" })
  } catch (error) {
    console.error("Remove member error:", error)
    return apiError((error as Error).message || "移除成员失败", 500)
  }
}

/**
 * 更新成员角色
 * PUT /api/families/[id]/members/[userId]/role
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const { role } = body

    if (!role || !["owner", "admin", "member", "viewer"].includes(role)) {
      return apiError("无效的角色")
    }

    // 验证权限
    const access = await validateFamilyAccess(session.user.id, params.id)

    // 只有 owner 可以修改角色
    if (!access.isOwner) {
      return apiError("只有家庭所有者可以修改成员角色", 403)
    }

    // 不能修改自己的角色
    if (params.userId === session.user.id) {
      return apiError("不能修改自己的角色")
    }

    // 检查目标成员
    const targetMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: params.id,
          userId: params.userId,
        },
      },
    })

    if (!targetMember) {
      return apiError("成员不存在", 404)
    }

    // 不能将 owner 降级
    if (targetMember.role === "owner" && role !== "owner") {
      return apiError("不能修改家庭所有者的角色")
    }

    // 不能将成员提升为 owner
    if (role === "owner") {
      return apiError("不能直接提升为所有者，请使用转移所有权功能")
    }

    await prisma.familyMember.update({
      where: {
        familyId_userId: {
          familyId: params.id,
          userId: params.userId,
        },
      },
      data: { role },
    })

    return apiSuccess({ message: "角色更新成功" })
  } catch (error) {
    console.error("Update member role error:", error)
    return apiError((error as Error).message || "更新角色失败", 500)
  }
}
