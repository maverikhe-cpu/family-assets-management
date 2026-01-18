import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFamilyStore } from './families'

export interface Member {
  id: string
  name: string
  role: string
  color: string
  order: number
  avatar?: string
  userId?: string
  createdAt: string
  updatedAt: string
}

export const useMemberStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)

  // 计算属性
  const activeMembers = computed(() => members.value)

  // Actions
  async function loadMembers() {
    loading.value = true
    try {
      const familyStore = useFamilyStore()

      // If we have family members from the backend, use them
      if (familyStore.currentFamily?.members) {
        members.value = familyStore.currentFamily.members.map((fm, index) => ({
          id: fm.userId,
          name: fm.user?.name || 'Unknown',
          role: fm.role,
          color: getMemberColor(fm.role, index),
          order: index + 1,
          userId: fm.userId,
          createdAt: fm.createdAt.toString(),
          updatedAt: fm.updatedAt.toString(),
        }))
      } else {
        // Fallback to localStorage for backwards compatibility
        const stored = localStorage.getItem('family_members')
        if (stored) {
          members.value = JSON.parse(stored)
        } else {
          // Initialize default members
          await initDefaultMembers()
        }
      }
    } finally {
      loading.value = false
    }
  }

  function getMemberColor(role: string, index: number): string {
    const colors: Record<string, string> = {
      owner: '#3B82F6',
      admin: '#8B5CF6',
      member: '#10B981',
      viewer: '#9CA3AF',
    }
    return colors[role] || `hsl(${(index * 60) % 360}, 70%, 50%)`
  }

  async function initDefaultMembers() {
    const defaultMembers: Member[] = [
      {
        id: 'member_owner',
        name: '本人',
        role: 'owner',
        color: '#3B82F6',
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    members.value = defaultMembers
    saveMembers()
  }

  async function addMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) {
    const newMember: Member = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    members.value.push(newMember)
    saveMembers()
    return newMember
  }

  async function updateMember(id: string, updates: Partial<Omit<Member, 'id'>>) {
    const index = members.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const current = members.value[index]
      if (!current) return
      members.value[index] = {
        id: current.id,
        name: updates.name ?? current.name,
        role: updates.role ?? current.role,
        color: updates.color ?? current.color,
        order: updates.order ?? current.order,
        avatar: updates.avatar ?? current.avatar,
        userId: updates.userId ?? current.userId,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString()
      }
      saveMembers()
    }
  }

  async function deleteMember(id: string) {
    members.value = members.value.filter(m => m.id !== id)
    saveMembers()
  }

  function saveMembers() {
    localStorage.setItem('family_members', JSON.stringify(members.value))
  }

  function getMemberById(id: string) {
    return members.value.find(m => m.id === id)
  }

  function getMemberName(id: string): string {
    const member = getMemberById(id)
    return member?.name || '未知'
  }

  function getMemberColorById(id: string): string {
    const member = getMemberById(id)
    return member?.color || '#9CA3AF'
  }

  return {
    // 状态
    members,
    loading,
    // 计算属性
    activeMembers,
    // 方法
    loadMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    getMemberName,
    getMemberColorById
  }
})
