import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, TransactionCategory } from '@/types'
import { api } from '@/api/client'

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
          color: cat?.color ?? '#999',
          icon: cat?.icon ?? '📁',
          name: cat?.name ?? '未知'
        }
      }
      const entry = result[t.categoryId]
      if (entry) {
        entry.amount += t.amount
        entry.count++
      }
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
          color: cat?.color ?? '#999',
          icon: cat?.icon ?? '📁',
          name: cat?.name ?? '未知'
        }
      }
      const entry = result[t.categoryId]
      if (entry) {
        entry.amount += t.amount
        entry.count++
      }
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
      transactions.value = await api.transactions.getAll()
      // 按日期倒序排序
      transactions.value.sort((a, b) => b.date.localeCompare(a.date))
    } catch (error) {
      console.error('Failed to load transactions:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function loadCategories() {
    try {
      // 加载所有分类（收入和支出）
      const [incomeCats, expenseCats] = await Promise.all([
        api.transactions.getCategories('income'),
        api.transactions.getCategories('expense')
      ])
      categories.value = [...incomeCats, ...expenseCats]
    } catch (error) {
      console.error('Failed to load categories:', error)
      throw error
    }
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.transactions.create(transaction)
    transactions.value.unshift(response as Transaction)
    return response as Transaction
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const response = await api.transactions.update(id, updates)
    // 更新本地状态
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value[index] = response as Transaction
    }
    return response as Transaction
  }

  async function deleteTransaction(id: string) {
    await api.transactions.delete(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
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
