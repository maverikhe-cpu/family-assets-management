import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
}

export class ApiClient {
  private client: AxiosInstance

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  getClient() {
    return this.client
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export API methods for specific resources
export const api = {
  // Assets
  assets: {
    getAll: () => apiClient.get<any[]>('/assets'),
    getById: (id: string) => apiClient.get<any>(`/assets/${id}`),
    create: (data: any) => apiClient.post('/assets', data),
    update: (id: string, data: any) => apiClient.patch(`/assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/assets/${id}`),
    getCategories: () => apiClient.get<any[]>('/assets/categories/list'),
    getChanges: (id: string) => apiClient.get<any[]>(`/assets/${id}/changes`),
  },

  // Transactions
  transactions: {
    getAll: () => apiClient.get<any[]>('/transactions'),
    getById: (id: string) => apiClient.get<any>(`/transactions/${id}`),
    create: (data: any) => apiClient.post('/transactions', data),
    update: (id: string, data: any) => apiClient.post(`/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transactions/${id}`),
    getStatistics: () => apiClient.get<any>('/transactions/statistics'),
    getCategories: (type?: 'income' | 'expense') =>
      apiClient.get<any[]>(`/transactions/categories/list${type ? `?type=${type}` : ''}`),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
    register: (data: any) =>
      apiClient.post<{ access_token: string; user: any }>('/auth/register', data),
    getProfile: () => apiClient.get<any>('/auth/profile'),
  },

  // Users
  users: {
    getAll: () => apiClient.get<any[]>('/users'),
    getById: (id: string) => apiClient.get<any>(`/users/${id}`),
    getMe: () => apiClient.get<any>('/users/me'),
    update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },
}
