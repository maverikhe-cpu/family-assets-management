import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'

export interface User {
  id: string
  username: string
  name: string
  role: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(
    localStorage.getItem('auth_user')
      ? JSON.parse(localStorage.getItem('auth_user')!)
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

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await api.auth.login(email, password)
      setToken(response.access_token)
      setUser(response.user)
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
      await api.auth.register(data)
      // After registration, automatically login
      return await login(data.email, data.password)
    } catch (error) {
      console.error('Registration failed:', error)
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

  return {
    token,
    user,
    loading,
    setToken,
    setUser,
    clearAuth,
    login,
    register,
    logout,
    isAuthenticated,
  }
})
