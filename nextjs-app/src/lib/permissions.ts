import { auth } from "@/lib/auth"
import { prisma } from "./prisma"

export type FamilyRole = "owner" | "admin" | "member" | "viewer"

/**
 * 从请求中获取当前会话
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

/**
 * 获取用户在家庭中的角色
 */
export async function getUserFamilyRole(
  userId: string,
  familyId: string
): Promise<FamilyRole | null> {
  const familyMember = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId,
      },
    },
  })

  return familyMember?.role as FamilyRole ?? null
}

/**
 * 检查用户是否有权限访问家庭数据
 */
export async function requireFamilyMembership(
  userId: string,
  familyId: string
) {
  const member = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId,
      },
    },
  })

  if (!member) {
    throw new Error("无权访问该家庭数据")
  }

  return member
}

/**
 * 检查用户是否有编辑权限
 * viewer 角色不能编辑
 */
export function canEditFamily(role: FamilyRole | null): boolean {
  if (!role) return false
  return role !== "viewer"
}

/**
 * 检查用户是否有管理权限
 * owner 和 admin 角色可以管理
 */
export function canManageFamily(role: FamilyRole | null): boolean {
  if (!role) return false
  return role === "owner" || role === "admin"
}

/**
 * 检查用户是否是家庭所有者
 */
export function isFamilyOwner(role: FamilyRole | null): boolean {
  return role === "owner"
}

/**
 * API 路由辅助函数 - 验证家庭访问权限
 */
export async function validateFamilyAccess(
  userId: string,
  familyId: string
) {
  const member = await requireFamilyMembership(userId, familyId)
  return {
    member,
    canEdit: canEditFamily(member.role as FamilyRole),
    canManage: canManageFamily(member.role as FamilyRole),
    isOwner: isFamilyOwner(member.role as FamilyRole),
  }
}

/**
 * API 路由错误响应
 */
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

/**
 * API 路由成功响应
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status })
}
