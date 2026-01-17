import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTransactionStore } from './transactions'
import type { Transaction, TransactionCategory } from '@/types'

// Mock the database
vi.mock('@/db', () => ({
  db: {
    transactions: {
      toArray: vi.fn(() => Promise.resolve([])),
      orderBy: vi.fn(() => ({
        reverse: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
      })),
      add: vi.fn(() => Promise.resolve('test-id')),
      update: vi.fn(() => Promise.resolve(1)),
      delete: vi.fn(() => Promise.resolve()),
    },
    transactionCategories: {
      toArray: vi.fn(() => Promise.resolve([])),
    },
  },
}))

describe('Transactions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state', () => {
    const store = useTransactionStore()
    expect(store.transactions).toEqual([])
    expect(store.categories).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('should calculate income and expense totals', () => {
    const store = useTransactionStore()

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 10000,
        categoryId: 'cat_1',
        accountId: 'asset_1',
        memberId: 'user_1',
        date: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        type: 'expense',
        amount: 3000,
        categoryId: 'cat_2',
        accountId: 'asset_1',
        memberId: 'user_1',
        date: '2024-01-02',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
      {
        id: '3',
        type: 'expense',
        amount: 2000,
        categoryId: 'cat_2',
        accountId: 'asset_1',
        memberId: 'user_1',
        date: '2024-01-03',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      },
    ]

    const mockCategories: TransactionCategory[] = [
      {
        id: 'cat_1',
        name: '工资',
        type: 'income',
        parentId: null,
        icon: '💼',
        color: '#10B981',
        isBuiltin: true,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'cat_2',
        name: '餐饮',
        type: 'expense',
        parentId: null,
        icon: '🍜',
        color: '#F59E0B',
        isBuiltin: true,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    store.transactions = mockTransactions
    store.categories = mockCategories

    expect(store.totalIncome).toBe(10000)
    expect(store.totalExpense).toBe(5000)
    expect(store.netIncome).toBe(5000)
  })

  it('should filter transactions by type', () => {
    const store = useTransactionStore()

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 10000,
        categoryId: 'cat_1',
        accountId: 'asset_1',
        memberId: 'user_1',
        date: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        type: 'expense',
        amount: 3000,
        categoryId: 'cat_2',
        accountId: 'asset_1',
        memberId: 'user_1',
        date: '2024-01-02',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
    ]

    store.transactions = mockTransactions

    expect(store.incomeTransactions.length).toBe(1)
    expect(store.expenseTransactions.length).toBe(1)
    expect(store.incomeTransactions[0].type).toBe('income')
    expect(store.expenseTransactions[0].type).toBe('expense')
  })
})
