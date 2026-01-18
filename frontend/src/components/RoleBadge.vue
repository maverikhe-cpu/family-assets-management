<template>
  <span class="role-badge" :class="`role-${role}`">
    <span class="role-badge-icon">{{ roleInfo.icon }}</span>
    <span class="role-badge-text">{{ roleInfo.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FamilyRole } from '@/stores/auth'

const props = defineProps<{
  role: FamilyRole
  size?: 'small' | 'medium' | 'large'
}>()

interface RoleInfo {
  icon: string
  label: string
  color: string
}

const roleMap: Record<FamilyRole, RoleInfo> = {
  owner: {
    icon: '👑',
    label: '所有者',
    color: '#3B82F6'
  },
  admin: {
    icon: '⭐',
    label: '管理员',
    color: '#8B5CF6'
  },
  member: {
    icon: '👤',
    label: '成员',
    color: '#10B981'
  },
  viewer: {
    icon: '👁️',
    label: '查看者',
    color: '#9CA3AF'
  }
}

const roleInfo = computed<RoleInfo>(() => roleMap[props.role] || roleMap.member)
</script>

<style scoped>
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background-color: var(--role-color);
  color: white;
  transition: all 0.2s ease;
}

.role-badge.role-owner {
  --role-color: #3B82F6;
}

.role-badge.role-admin {
  --role-color: #8B5CF6;
}

.role-badge.role-member {
  --role-color: #10B981;
}

.role-badge.role-viewer {
  --role-color: #9CA3AF;
}

.role-badge.small {
  padding: 2px 8px;
  font-size: 11px;
}

.role-badge.large {
  padding: 6px 14px;
  font-size: 14px;
}

.role-badge-icon {
  font-size: 1.1em;
  line-height: 1;
}

.role-badge-text {
  line-height: 1;
}
</style>
