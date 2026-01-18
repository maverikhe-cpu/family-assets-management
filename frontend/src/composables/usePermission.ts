import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { FamilyRole } from '@/stores/auth'

export type PermissionType = 'edit' | 'admin' | 'owner'

export interface PermissionOptions {
  type?: PermissionType
  role?: FamilyRole
}

/**
 * Composable for checking user permissions
 *
 * @example
 * const { canEdit, isAdmin, isOwner, hasPermission } = usePermission()
 *
 * const { canEdit: canEditAssets } = usePermission({ type: 'edit' })
 * const { hasPermission: canDeleteFamily } = usePermission({ type: 'owner' })
 */
export function usePermission(options?: PermissionOptions) {
  const authStore = useAuthStore()

  // Direct permission checks
  const canEdit = computed(() => authStore.canEdit())
  const isAdmin = computed(() => authStore.isAdmin())
  const isOwner = computed(() => authStore.isOwner())
  const familyRole = computed(() => authStore.familyRole)
  const hasFamily = computed(() => authStore.hasFamily())

  // Custom permission check based on options
  const hasPermission = computed(() => {
    if (!options) return true

    switch (options.type) {
      case 'edit':
        return authStore.canEdit()
      case 'admin':
        return authStore.isAdmin()
      case 'owner':
        return authStore.isOwner()
      default:
        if (options.role) {
          return authStore.familyRole === options.role
        }
        return true
    }
  })

  // Permission level (0=viewer, 1=member, 2=admin, 3=owner)
  const permissionLevel = computed(() => {
    const roleLevels: Record<FamilyRole, number> = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3
    }
    return roleLevels[authStore.familyRole || 'viewer'] ?? 0
  })

  // Check if current user's permission level is at least the required level
  const hasPermissionLevel = (requiredLevel: number) => {
    return permissionLevel.value >= requiredLevel
  }

  return {
    canEdit,
    isAdmin,
    isOwner,
    familyRole,
    hasFamily,
    hasPermission,
    permissionLevel,
    hasPermissionLevel
  }
}
