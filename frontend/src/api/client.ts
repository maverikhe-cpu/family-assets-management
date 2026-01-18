export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
}

interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string>
}

export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private timeout: number

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    this.timeout = config.timeout || 10000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    return url.toString()
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<T> {
    const url = this.buildUrl(path, config.params)
    const headers = { ...this.defaultHeaders, ...config.headers }

    // Add auth token
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    options.signal = controller.signal

    try {
      const response = await fetch(url, options)
      clearTimeout(timeoutId)

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw errorData
      }

      return await response.json()
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config)
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config)
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export API methods for specific resources
export const api = {
  // Families
  families: {
    getAll: () => apiClient.get<any[]>('/families'),
    getById: (id: string) => apiClient.get<any>(`/families/${id}`),
    create: (data: { name: string; description?: string }) =>
      apiClient.post<any>('/families', data),
    update: (id: string, data: { name?: string; description?: string }) =>
      apiClient.put<any>(`/families/${id}`, data),
    delete: (id: string) => apiClient.delete(`/families/${id}`),
    addMember: (familyId: string, userId: string, role?: string) =>
      apiClient.post<any>(`/families/${familyId}/members`, { userId, role }),
    removeMember: (familyId: string, userId: string) =>
      apiClient.delete(`/families/${familyId}/members/${userId}`),
    updateMemberRole: (familyId: string, userId: string, role: string) =>
      apiClient.put<any>(`/families/${familyId}/members/${userId}/role`, { role }),
    joinByInviteCode: (inviteCode: string) =>
      apiClient.post<{ familyId: string; role: string }>(`/families/join/${inviteCode}`),
    switchFamily: (familyId: string) =>
      apiClient.post<{ familyId: string }>(`/families/${familyId}/switch`),
    regenerateInviteCode: (familyId: string) =>
      apiClient.post<{ inviteCode: string }>(`/families/${familyId}/regenerate-invite-code`),
  },

  // Assets
  assets: {
    getAll: () => apiClient.get<any[]>('/assets'),
    getById: (id: string) => apiClient.get<any>(`/assets/${id}`),
    create: (data: unknown) => apiClient.post('/assets', data),
    update: (id: string, data: unknown) => apiClient.patch(`/assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/assets/${id}`),
    getCategories: () => apiClient.get<any[]>('/assets/categories/list'),
    getChanges: (id: string) => apiClient.get<any[]>(`/assets/${id}/changes`),
  },

  // Transactions
  transactions: {
    getAll: () => apiClient.get<any[]>('/transactions'),
    getById: (id: string) => apiClient.get<any>(`/transactions/${id}`),
    create: (data: unknown) => apiClient.post('/transactions', data),
    update: (id: string, data: unknown) => apiClient.post(`/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transactions/${id}`),
    getStatistics: () => apiClient.get<any>('/transactions/statistics'),
    getCategories: (type?: 'income' | 'expense') =>
      apiClient.get<any[]>(`/transactions/categories/list${type ? `?type=${type}` : ''}`),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<{ access_token: string; user: unknown }>('/auth/login', { email, password }),
    register: (data: unknown) =>
      apiClient.post<{ access_token: string; user: unknown }>('/auth/register', data),
    getProfile: () => apiClient.get<unknown>('/auth/profile'),
  },

  // Users
  users: {
    getAll: () => apiClient.get<unknown[]>('/users'),
    getById: (id: string) => apiClient.get<unknown>(`/users/${id}`),
    getMe: () => apiClient.get<unknown>('/users/me'),
    update: (id: string, data: unknown) => apiClient.patch(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },
}
