import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'

export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface User {
  id: string
  name: string
  role: string
  email: string
  familyId?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(
    localStorage.getItem('auth_user')
      ? JSON.parse(localStorage.getItem('auth_user')!)
      : null
  )
  const familyRole = ref<FamilyRole | null>(
    localStorage.getItem('family_role')
      ? (localStorage.getItem('family_role')! as FamilyRole)
      : null
  )
  const loading = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  function setUser(newUser: User) {
    user.value = newUser
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  function setFamilyRole(role: FamilyRole | null) {
    familyRole.value = role
    if (role) {
      localStorage.setItem('family_role', role)
    } else {
      localStorage.removeItem('family_role')
    }
  }

  function clearAuth() {
    token.value = null
    user.value = null
    familyRole.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('family_role')
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await api.auth.login(email, password)
      setToken(response.access_token)
      setUser(response.user as User)
      // Family role is stored in the JWT and handled by the backend
      // We'll fetch it separately if needed
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function register(data: any) {
    loading.value = true
    try {
      const response = await api.auth.register(data)
      setToken(response.access_token)
      setUser(response.user as User)
      return response
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function switchFamily(familyId: string) {
    loading.value = true
    try {
      const response = await api.families.switchFamily(familyId)
      // Update user's current family
      if (user.value) {
        user.value.familyId = response.familyId
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
      return response
    } catch (error) {
      console.error('Switch family failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearAuth()
  }

  function isAuthenticated() {
    return !!token.value
  }

  function hasFamily() {
    return !!user.value?.familyId
  }

  function canEdit(): boolean {
    if (!familyRole.value) return false
    return familyRole.value !== 'viewer'
  }

  function isAdmin(): boolean {
    if (!familyRole.value) return false
    return familyRole.value === 'owner' || familyRole.value === 'admin'
  }

  function isOwner(): boolean {
    return familyRole.value === 'owner'
  }

  return {
    token,
    user,
    familyRole,
    loading,
    setToken,
    setUser,
    setFamilyRole,
    clearAuth,
    login,
    register,
    switchFamily,
    logout,
    isAuthenticated,
    hasFamily,
    canEdit,
    isAdmin,
    isOwner,
  }
})
