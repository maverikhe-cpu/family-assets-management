import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, TransactionCategory } from '@/types'
import * as db from '@/db'

export const useTransactionStore = defineStore('transactions', () => {
  // 状态
  const transactions = ref<Transaction[]>([])
  const categories = ref<TransactionCategory[]>([])
  const loading = ref(false)

  // 计算属性
  const incomeTransactions = computed(() =>
    transactions.value.filter(t => t.type === 'income')
  )

  const expenseTransactions = computed(() =>
    transactions.value.filter(t => t.type === 'expense')
  )

  // 总收入
  const totalIncome = computed(() =>
    incomeTransactions.value.reduce((sum, t) => sum + t.amount, 0)
  )

  // 总支出
  const totalExpense = computed(() =>
    expenseTransactions.value.reduce((sum, t) => sum + t.amount, 0)
  )

  // 净收入
  const netIncome = computed(() => totalIncome.value - totalExpense.value)

  // 按分类统计支出
  const expenseByCategory = computed(() => {
    const result: Record<string, { amount: number; count: number; color: string; icon: string; name: string }> = {}
    for (const t of expenseTransactions.value) {
      if (!result[t.categoryId]) {
        const cat = categories.value.find(c => c.id === t.categoryId)
        result[t.categoryId] = {
          amount: 0,
          count: 0,
          color: cat?.color || '#999',
          icon: cat?.icon || '📁',
          name: cat?.name || '未知'
        }
      }
      result[t.categoryId].amount += t.amount
      result[t.categoryId].count++
    }
    return result
  })

  // 按分类统计收入
  const incomeByCategory = computed(() => {
    const result: Record<string, { amount: number; count: number; color: string; icon: string; name: string }> = {}
    for (const t of incomeTransactions.value) {
      if (!result[t.categoryId]) {
        const cat = categories.value.find(c => c.id === t.categoryId)
        result[t.categoryId] = {
          amount: 0,
          count: 0,
          color: cat?.color || '#999',
          icon: cat?.icon || '📁',
          name: cat?.name || '未知'
        }
      }
      result[t.categoryId].amount += t.amount
      result[t.categoryId].count++
    }
    return result
  })

  // 按月份统计
  const monthlyStats = computed(() => {
    const result: Record<string, { income: number; expense: number; net: number }> = {}
    for (const t of transactions.value) {
      const month = t.date.substring(0, 7) // YYYY-MM
      if (!result[month]) {
        result[month] = { income: 0, expense: 0, net: 0 }
      }
      if (t.type === 'income') {
        result[month].income += t.amount
      } else if (t.type === 'expense') {
        result[month].expense += t.amount
      }
      result[month].net = result[month].income - result[month].expense
    }
    return result
  })

  // Actions
  async function loadTransactions() {
    loading.value = true
    try {
      transactions.value = await db.db.transactions.orderBy('date').reverse().toArray()
    } finally {
      loading.value = false
    }
  }

  async function loadCategories() {
    categories.value = await db.db.transactionCategories.toArray()
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    }
    await db.db.transactions.add(newTransaction)
    await loadTransactions()
    return newTransaction
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    await db.db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    await loadTransactions()
  }

  async function deleteTransaction(id: string) {
    await db.db.transactions.delete(id)
    await loadTransactions()
  }

  function getCategoryById(id: string) {
    return categories.value.find(c => c.id === id)
  }

  function getIncomeCategories() {
    return categories.value.filter(c => c.type === 'income')
  }

  function getExpenseCategories() {
    return categories.value.filter(c => c.type === 'expense')
  }

  return {
    // 状态
    transactions,
    categories,
    loading,
    // 计算属性
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    netIncome,
    expenseByCategory,
    incomeByCategory,
    monthlyStats,
    // 方法
    loadTransactions,
    loadCategories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategoryById,
    getIncomeCategories,
    getExpenseCategories
  }
})
