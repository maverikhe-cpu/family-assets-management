import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAssetStore } from './assets'
import type { Asset, AssetCategory } from '@/types'

// Mock the database
vi.mock('@/db', () => ({
  db: {
    assets: {
      toArray: vi.fn(() => Promise.resolve([])),
      add: vi.fn(() => Promise.resolve('test-id')),
      update: vi.fn(() => Promise.resolve(1)),
      delete: vi.fn(() => Promise.resolve()),
    },
    assetCategories: {
      toArray: vi.fn(() => Promise.resolve([])),
      count: vi.fn(() => Promise.resolve(0)),
    },
    assetChanges: {
      where: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
      add: vi.fn(() => Promise.resolve('change-id')),
    },
  },
  initDefaultAssetCategories: vi.fn(() => Promise.resolve()),
  initDefaultTransactionCategories: vi.fn(() => Promise.resolve()),
}))

describe('Assets Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state', () => {
    const store = useAssetStore()
    expect(store.assets).toEqual([])
    expect(store.categories).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('should calculate statistics correctly', async () => {
    const store = useAssetStore()

    // Mock data
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: '银行存款',
        categoryId: 'cat_1',
        holderId: 'user_1',
        initialValue: 100000,
        currentValue: 120000,
        currency: 'CNY',
        purchaseDate: '2024-01-01',
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: '房贷',
        categoryId: 'debt_1',
        holderId: 'user_1',
        initialValue: 500000,
        currentValue: 480000,
        currency: 'CNY',
        purchaseDate: '2023-01-01',
        status: 'active',
        createdAt: '2023-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    const mockCategories: AssetCategory[] = [
      {
        id: 'cat_1',
        name: '银行存款',
        parentId: '流动资产',
        icon: '🏦',
        color: '#10B981',
        isBuiltin: true,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '流动资产',
        name: '流动资产',
        parentId: null,
        icon: '💰',
        color: '#10B981',
        isBuiltin: true,
        order: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'debt_1',
        name: '房贷',
        parentId: '负债',
        icon: '🏠',
        color: '#EF4444',
        isBuiltin: true,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '负债',
        name: '负债',
        parentId: null,
        icon: '📉',
        color: '#EF4444',
        isBuiltin: true,
        order: 4,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    // Set the data directly
    store.assets = mockAssets
    store.categories = mockCategories

    const stats = store.statistics
    expect(stats.totalAssets).toBe(120000)
    expect(stats.totalLiabilities).toBe(480000)
    expect(stats.netWorth).toBe(-360000)
  })

  it('should filter only active assets', () => {
    const store = useAssetStore()

    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Active Asset',
        categoryId: 'cat_1',
        holderId: 'user_1',
        initialValue: 1000,
        currentValue: 1000,
        currency: 'CNY',
        purchaseDate: '2024-01-01',
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Disposed Asset',
        categoryId: 'cat_1',
        holderId: 'user_1',
        initialValue: 2000,
        currentValue: 0,
        currency: 'CNY',
        purchaseDate: '2023-01-01',
        status: 'disposed',
        createdAt: '2023-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    store.assets = mockAssets
    expect(store.activeAssets.length).toBe(1)
    expect(store.activeAssets[0].status).toBe('active')
  })
})
