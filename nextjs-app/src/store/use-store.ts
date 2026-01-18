import { create } from "zustand"
import { persist } from "zustand/middleware"

// Types
export type FamilyRole = "owner" | "admin" | "member" | "viewer"

export interface User {
  id: string
  email: string
  name: string
  role: string
  familyId: string | null
  familyRole: FamilyRole | null
}

export interface Family {
  id: string
  name: string
  description: string | null
  inviteCode: string
  role: FamilyRole
  memberCount: number
  createdAt: string
}

export interface Asset {
  id: string
  name: string
  categoryId: string
  familyId: string
  holderId: string
  initialValue: number
  currentValue: number
  currency: string
  purchaseDate: string
  status: "active" | "disposed" | "pending"
  notes: string | null
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
  holder: {
    id: string
    name: string
    email: string
  }
}

export interface Transaction {
  id: string
  type: "income" | "expense" | "transfer"
  amount: number
  categoryId: string
  accountId: string
  familyId: string
  memberId: string
  date: string
  notes: string | null
  tags: string[]
  relatedAssetId: string | null
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
  member: {
    id: string
    name: string
    email: string
  }
}

export interface AssetCategory {
  id: string
  name: string
  parentId: string | null
  familyId: string
  icon: string
  color: string
  isBuiltin: boolean
  order: number
}

export interface TransactionCategory {
  id: string
  name: string
  type: "income" | "expense"
  familyId: string
  parentId: string | null
  icon: string
  color: string
  isBuiltin: boolean
  order: number
}

// API Client
const API_BASE = "/api"

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "请求失败" }))
    throw new Error(error.error || "请求失败")
  }

  return res.json()
}

// Store
interface AppStore {
  // User & Auth
  user: User | null
  setUser: (user: User | null) => void

  // Families
  families: Family[]
  setFamilies: (families: Family[]) => void
  currentFamily: Family | null
  setCurrentFamily: (family: Family | null) => void

  // Assets
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
  assetCategories: AssetCategory[]
  setAssetCategories: (categories: AssetCategory[]) => void

  // Transactions
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  transactionCategories: TransactionCategory[]
  setTransactionCategories: (categories: TransactionCategory[]) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // API Methods
  fetchFamilies: () => Promise<void>
  fetchAssets: (params?: Record<string, string>) => Promise<void>
  fetchTransactions: (params?: Record<string, string>) => Promise<void>
  fetchAssetCategories: () => Promise<void>
  fetchTransactionCategories: (type?: string) => Promise<void>
  createAsset: (data: Omit<Asset, "id" | "createdAt" | "updatedAt" | "category" | "holder">) => Promise<Asset>
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  createTransaction: (data: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "category" | "member">) => Promise<Transaction>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  switchFamily: (familyId: string) => Promise<void>

  // Permission helpers
  canEdit: () => boolean
  canManage: () => boolean
  isOwner: () => boolean
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // User & Auth
      user: null,
      setUser: (user) => set({ user }),

      // Families
      families: [],
      setFamilies: (families) => set({ families }),
      currentFamily: null,
      setCurrentFamily: (family) => set({ currentFamily: family }),

      // Assets
      assets: [],
      setAssets: (assets) => set({ assets }),
      assetCategories: [],
      setAssetCategories: (categories) => set({ assetCategories }),

      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      transactionCategories: [],
      setTransactionCategories: (categories) => set({ transactionCategories }),

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // API Methods
      fetchFamilies: async () => {
        const data = await apiRequest<{ families: Family[] }>("/families")
        set({ families: data.families })
        if (data.families.length > 0 && !get().currentFamily) {
          const current = data.families.find((f) => f.id === get().user?.familyId) || data.families[0]
          set({ currentFamily: current })
        }
      },

      fetchAssets: async (params) => {
        const query = new URLSearchParams(params).toString()
        const data = await apiRequest<{ assets: Asset[] }>(`/assets${query ? `?${query}` : ""}`)
        set({ assets: data.assets })
      },

      fetchTransactions: async (params) => {
        const query = new URLSearchParams(params).toString()
        const data = await apiRequest<{ transactions: Transaction[] }>(`/transactions${query ? `?${query}` : ""}`)
        set({ transactions: data.transactions })
      },

      fetchAssetCategories: async () => {
        const data = await apiRequest<{ categories: AssetCategory[] }>("/assets/categories")
        set({ assetCategories: data.categories })
      },

      fetchTransactionCategories: async (type) => {
        const query = type ? `?type=${type}` : ""
        const data = await apiRequest<{ categories: TransactionCategory[] }>(`/transactions/categories${query}`)
        set({ transactionCategories: data.categories })
      },

      createAsset: async (data) => {
        const res = await apiRequest<{ asset: Asset }>("/assets", {
          method: "POST",
          body: JSON.stringify(data),
        })
        const { assets } = get()
        set({ assets: [res.asset, ...assets] })
        return res.asset
      },

      updateAsset: async (id, data) => {
        const res = await apiRequest<{ asset: Asset }>(`/assets/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        })
        const { assets } = get()
        set({ assets: assets.map((a) => (a.id === id ? res.asset : a)) })
      },

      deleteAsset: async (id) => {
        await apiRequest(`/assets/${id}`, { method: "DELETE" })
        const { assets } = get()
        set({ assets: assets.filter((a) => a.id !== id) })
      },

      createTransaction: async (data) => {
        const res = await apiRequest<{ transaction: Transaction }>("/transactions", {
          method: "POST",
          body: JSON.stringify(data),
        })
        const { transactions } = get()
        set({ transactions: [res.transaction, ...transactions] })
        return res.transaction
      },

      updateTransaction: async (id, data) => {
        const res = await apiRequest<{ transaction: Transaction }>(`/transactions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        })
        const { transactions } = get()
        set({ transactions: transactions.map((t) => (t.id === id ? res.transaction : t)) })
      },

      deleteTransaction: async (id) => {
        await apiRequest(`/transactions/${id}`, { method: "DELETE" })
        const { transactions } = get()
        set({ transactions: transactions.filter((t) => t.id !== id) })
      },

      switchFamily: async (familyId) => {
        await apiRequest(`/families/${familyId}/switch`, { method: "POST" })
        const { user, families } = get()
        const family = families.find((f) => f.id === familyId)
        if (family && user) {
          set({ currentFamily: family, user: { ...user, familyId, familyRole: family.role } })
        }
      },

      // Permission helpers
      canEdit: () => {
        const { user } = get()
        return user?.familyRole !== "viewer" && !!user?.familyRole
      },

      canManage: () => {
        const { user } = get()
        return user?.familyRole === "owner" || user?.familyRole === "admin"
      },

      isOwner: () => {
        const { user } = get()
        return user?.familyRole === "owner"
      },
    }),
    {
      name: "family-assets-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        user: state.user,
        currentFamily: state.currentFamily,
      }),
    }
  )
)
