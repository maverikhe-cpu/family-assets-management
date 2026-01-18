import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { FamilyRole } from './auth'

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: FamilyRole
  invitedBy?: string
  user?: {
    id: string
    name: string
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Family {
  id: string
  name: string
  description?: string
  inviteCode: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  members?: FamilyMember[]
}

export const useFamilyStore = defineStore('families', () => {
  const families = ref<Family[]>([])
  const currentFamily = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasFamilies = computed(() => families.value.length > 0)
  const memberCount = computed(() => currentFamily.value?.members?.length || 0)
  const inviteCode = computed(() => currentFamily.value?.inviteCode || '')

  async function fetchFamilies() {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.getAll()
      families.value = response

      // Set current family if not set
      if (!currentFamily.value && response.length > 0) {
        currentFamily.value = response[0]
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch families'
      console.error('Failed to fetch families:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchFamily(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.getById(id)
      currentFamily.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch family'
      console.error('Failed to fetch family:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createFamily(data: { name: string; description?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.create(data)
      families.value.push(response)
      currentFamily.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create family'
      console.error('Failed to create family:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateFamily(id: string, data: { name?: string; description?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.update(id, data)
      // Update in families list
      const index = families.value.findIndex(f => f.id === id)
      if (index !== -1) {
        families.value[index] = response
      }
      // Update current family if it's the same
      if (currentFamily.value?.id === id) {
        currentFamily.value = response
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update family'
      console.error('Failed to update family:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteFamily(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.families.delete(id)
      // Remove from families list
      families.value = families.value.filter(f => f.id !== id)
      // Clear current family if it's the same
      if (currentFamily.value?.id === id) {
        currentFamily.value = families.value[0] || null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete family'
      console.error('Failed to delete family:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addMember(familyId: string, userId: string, role?: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.addMember(familyId, userId, role)
      // Refresh family to get updated members list
      await fetchFamily(familyId)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to add member'
      console.error('Failed to add member:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeMember(familyId: string, userId: string) {
    loading.value = true
    error.value = null
    try {
      await api.families.removeMember(familyId, userId)
      // Refresh family to get updated members list
      await fetchFamily(familyId)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to remove member'
      console.error('Failed to remove member:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateMemberRole(familyId: string, userId: string, role: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.updateMemberRole(familyId, userId, role)
      // Refresh family to get updated members list
      await fetchFamily(familyId)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update member role'
      console.error('Failed to update member role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function joinByInviteCode(inviteCode: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.families.joinByInviteCode(inviteCode)
      // Refresh families list
      await fetchFamilies()
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to join family'
      console.error('Failed to join family:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentFamily(family: Family | null) {
    currentFamily.value = family
  }

  function clearFamilies() {
    families.value = []
    currentFamily.value = null
    error.value = null
  }

  return {
    families,
    currentFamily,
    loading,
    error,
    hasFamilies,
    memberCount,
    inviteCode,
    fetchFamilies,
    fetchFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    addMember,
    removeMember,
    updateMemberRole,
    joinByInviteCode,
    setCurrentFamily,
    clearFamilies,
  }
})
