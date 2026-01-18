<template>
  <slot v-if="hasPermission" />
  <slot v-else-if="fallback" name="fallback" />
  <span v-else-if="showPlaceholder" class="permission-placeholder">
    <slot name="placeholder">
      <span class="permission-message">🔒 您没有权限执行此操作</span>
    </slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type PermissionType = 'edit' | 'admin' | 'owner'

const props = withDefaults(
  defineProps<{
    type?: PermissionType
    role?: string
    fallback?: boolean
    showPlaceholder?: boolean
  }>(),
  {
    type: 'edit',
    fallback: false,
    showPlaceholder: true
  }
)

const authStore = useAuthStore()

const hasPermission = computed(() => {
  switch (props.type) {
    case 'edit':
      return authStore.canEdit()
    case 'admin':
      return authStore.isAdmin()
    case 'owner':
      return authStore.isOwner()
    default:
      if (props.role) {
        return authStore.familyRole === props.role
      }
      return true
  }
})
</script>

<style scoped>
.permission-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background-color: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
}

.permission-message {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
