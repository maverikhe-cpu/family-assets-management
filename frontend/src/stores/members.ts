import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Member } from '@/types'

export const useMemberStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)

  // 计算属性
  const activeMembers = computed(() => members.value)

  // Actions
  async function loadMembers() {
    loading.value = true
    try {
      // 从 localStorage 读取成员数据
      const stored = localStorage.getItem('family_members')
      if (stored) {
        members.value = JSON.parse(stored)
      } else {
        // 初始化默认成员
        await initDefaultMembers()
      }
    } finally {
      loading.value = false
    }
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
      },
      {
        id: 'member_spouse',
        name: '配偶',
        role: 'spouse',
        color: '#EC4899',
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'member_child',
        name: '子女',
        role: 'child',
        color: '#10B981',
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'member_shared',
        name: '共有',
        role: 'other',
        color: '#8B5CF6',
        order: 4,
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
    getMemberName
  }
})
