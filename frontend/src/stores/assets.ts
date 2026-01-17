import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Asset, AssetCategory, AssetChange, AssetStatistics, AssetDistribution, AssetChangeStatistics, AssetChangeType } from '@/types'
import * as db from '@/db'
import { api } from '@/api/client'
import { convertCurrency } from '@/utils/currency'
import dayjs from 'dayjs'

// 基准货币
const BASE_CURRENCY = 'CNY'

// 是否使用后端 API
const USE_API = true

export const useAssetStore = defineStore('assets', () => {
  // 状态
  const assets = ref<Asset[]>([])
  const categories = ref<AssetCategory[]>([])
  const changes = ref<AssetChange[]>([])
  const loading = ref(false)

  // 计算属性
  const activeAssets = computed(() => assets.value.filter(a => a.status === 'active'))

  // 根据一级分类名称获取其所有二级分类的ID
  function getChildCategoryIds(parentName: string): string[] {
    const parent = categories.value.find(c => c.name === parentName && !c.parentId)
    if (!parent) return []
    return categories.value
      .filter(c => c.parentId === parent.id)
      .map(c => c.id)
  }

  // 固定资产
  const fixedAssets = computed(() => {
    const fixedCategoryIds = getChildCategoryIds('固定资产')
    return activeAssets.value.filter(a => fixedCategoryIds.includes(a.categoryId))
  })

  // 流动资产
  const liquidAssets = computed(() => {
    const liquidCategoryIds = getChildCategoryIds('流动资产')
    return activeAssets.value.filter(a => liquidCategoryIds.includes(a.categoryId))
  })

  // 投资资产
  const investmentAssets = computed(() => {
    const investmentCategoryIds = getChildCategoryIds('投资资产')
    return activeAssets.value.filter(a => investmentCategoryIds.includes(a.categoryId))
  })

  // 负债
  const liabilities = computed(() => {
    const liabilityCategoryIds = getChildCategoryIds('负债')
    return activeAssets.value.filter(a => liabilityCategoryIds.includes(a.categoryId))
  })

  // 统计数据（所有金额转换为基准货币）
  const statistics = computed((): AssetStatistics => {
    // 将资产金额转换为基准货币
    const toBaseCurrency = (amount: number, currency: string) =>
      convertCurrency(amount, currency, BASE_CURRENCY)

    // 计算总资产（排除负债）
    const totalAssets = activeAssets.value
      .filter(a => !liabilities.value.some(l => l.id === a.id))
      .reduce((sum, a) => sum + toBaseCurrency(a.currentValue, a.currency), 0)

    // 计算总负债
    const totalLiabilities = liabilities.value
      .reduce((sum, a) => sum + toBaseCurrency(a.currentValue, a.currency), 0)

    // 计算各类资产金额
    const liquidAmount = liquidAssets.value
      .reduce((sum, a) => sum + toBaseCurrency(a.currentValue, a.currency), 0)
    const fixedAmount = fixedAssets.value
      .reduce((sum, a) => sum + toBaseCurrency(a.currentValue, a.currency), 0)
    const investmentAmount = investmentAssets.value
      .reduce((sum, a) => sum + toBaseCurrency(a.currentValue, a.currency), 0)

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      liquidAssets: liquidAmount,
      fixedAssets: fixedAmount,
      investmentAssets: investmentAmount,
      liabilityRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0
    }
  })

  // 资产分布（所有金额转换为基准货币）
  const distribution = computed((): AssetDistribution[] => {
    const topCategories = categories.value.filter(c => !c.parentId)
    return topCategories.map(cat => {
      const categoryAssets = assets.value.filter(a => {
        // 检查资产是否属于该一级分类（通过二级分类）
        const subCategories = categories.value.filter(sc => sc.parentId === cat.id)
        return subCategories.some(sc => sc.id === a.categoryId)
      })

      // 将金额转换为基准货币
      const amount = categoryAssets.reduce((sum, a) =>
        sum + convertCurrency(a.currentValue, a.currency, BASE_CURRENCY), 0)
      const total = statistics.value.totalAssets + statistics.value.totalLiabilities

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: cat.color
      }
    }).filter(d => d.amount > 0)
  })

  // Actions
  async function loadAssets() {
    loading.value = true
    try {
      assets.value = await db.db.assets.toArray()
    } finally {
      loading.value = false
    }
  }

  async function loadCategories() {
    if (USE_API) {
      try {
        const data = await api.assets.getCategories()
        // Transform backend data to frontend format
        categories.value = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
          icon: cat.icon,
          color: cat.color,
          isBuiltin: cat.isBuiltin,
          order: cat.order,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt
        }))
      } catch (error) {
        console.error('Failed to load categories from API, falling back to local DB:', error)
        categories.value = await db.db.assetCategories.toArray()
      }
    } else {
      categories.value = await db.db.assetCategories.toArray()
    }
  }

  async function loadChanges(assetId?: string) {
    if (assetId) {
      changes.value = await db.db.assetChanges.where('assetId').equals(assetId).toArray()
    } else {
      changes.value = await db.db.assetChanges.toArray()
    }
  }

  async function addAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newAsset: Asset = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    }
    await db.db.assets.add(newAsset)
    await loadAssets()
    return newAsset
  }

  async function updateAsset(id: string, updates: Partial<Asset>) {
    await db.db.assets.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    await loadAssets()
  }

  async function deleteAsset(id: string) {
    await db.db.assets.delete(id)
    await loadAssets()
  }

  async function addAssetChange(change: Omit<AssetChange, 'id' | 'createdAt'>) {
    const now = new Date().toISOString()
    const newChange: AssetChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now
    }
    await db.db.assetChanges.add(newChange)
    return newChange
  }

  /**
   * 记录资产价值变更（自动计算盈亏）
   */
  async function recordValueChange(
    assetId: string,
    newValue: number,
    type: AssetChangeType,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const afterValue = newValue
    const amount = type === 'valuation_adjust' ? afterValue - beforeValue : afterValue

    // 计算盈亏
    let profitLoss: number | undefined
    let profitLossRate: number | undefined

    if (type === 'sell' || type === 'valuation_adjust') {
      profitLoss = afterValue - beforeValue
      profitLossRate = beforeValue > 0 ? (profitLoss / beforeValue) * 100 : 0
    }

    const change = await addAssetChange({
      assetId,
      type,
      amount,
      beforeValue,
      afterValue,
      profitLoss,
      profitLossRate,
      date: dayjs().format('YYYY-MM-DD'),
      notes
    })

    // 更新资产当前价值
    await updateAsset(assetId, { currentValue: newValue })

    return change
  }

  /**
   * 记录资产买入
   */
  async function recordBuy(
    assetId: string,
    amount: number,
    date: string,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const afterValue = beforeValue + amount

    await addAssetChange({
      assetId,
      type: 'buy',
      amount,
      beforeValue,
      afterValue,
      date,
      notes
    })

    await updateAsset(assetId, { currentValue: afterValue })
  }

  /**
   * 记录资产卖出
   */
  async function recordSell(
    assetId: string,
    amount: number,
    date: string,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const afterValue = beforeValue - amount

    if (afterValue < 0) throw new Error('卖出金额不能超过当前价值')

    // 计算盈亏（需要记录原始买入价才能准确计算）
    const profitLoss = 0
    const profitLossRate = 0

    await addAssetChange({
      assetId,
      type: 'sell',
      amount,
      beforeValue,
      afterValue,
      profitLoss,
      profitLossRate,
      date,
      notes
    })

    await updateAsset(assetId, { currentValue: afterValue })
  }

  /**
   * 记录资产转入
   */
  async function recordTransferIn(
    assetId: string,
    amount: number,
    fromMemberId?: string,
    date?: string,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const afterValue = beforeValue + amount

    await addAssetChange({
      assetId,
      type: 'transfer_in',
      amount,
      beforeValue,
      afterValue,
      relatedAssetId: fromMemberId,
      date: date || dayjs().format('YYYY-MM-DD'),
      notes
    })

    await updateAsset(assetId, { currentValue: afterValue })
  }

  /**
   * 记录资产转出
   */
  async function recordTransferOut(
    assetId: string,
    amount: number,
    toMemberId?: string,
    date?: string,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const afterValue = beforeValue - amount

    if (afterValue < 0) throw new Error('转出金额不能超过当前价值')

    await addAssetChange({
      assetId,
      type: 'transfer_out',
      amount,
      beforeValue,
      afterValue,
      relatedAssetId: toMemberId,
      date: date || dayjs().format('YYYY-MM-DD'),
      notes
    })

    await updateAsset(assetId, { currentValue: afterValue })
  }

  /**
   * 记录资产处置
   */
  async function recordDispose(
    assetId: string,
    disposeValue: number,
    date: string,
    notes?: string
  ) {
    const asset = assets.value.find(a => a.id === assetId)
    if (!asset) throw new Error('资产不存在')

    const beforeValue = asset.currentValue
    const profitLoss = disposeValue - beforeValue
    const profitLossRate = beforeValue > 0 ? (profitLoss / beforeValue) * 100 : 0

    await addAssetChange({
      assetId,
      type: 'dispose',
      amount: disposeValue,
      beforeValue,
      afterValue: 0,
      profitLoss,
      profitLossRate,
      date,
      notes: notes || '资产处置'
    })

    // 更新资产状态为已处置
    await updateAsset(assetId, { currentValue: 0, status: 'disposed' })
  }

  /**
   * 获取资产变动统计
   */
  async function getChangeStatistics(assetId: string): Promise<AssetChangeStatistics> {
    await loadChanges(assetId)

    const assetChanges = changes.value
    const totalChanges = assetChanges.length

    // 计算总盈亏
    let totalProfit = 0
    let totalLoss = 0

    for (const change of assetChanges) {
      if (change.profitLoss) {
        if (change.profitLoss > 0) {
          totalProfit += change.profitLoss
        } else {
          totalLoss += Math.abs(change.profitLoss)
        }
      }
    }

    const netProfitLoss = totalProfit - totalLoss

    // 计算平均盈利率
    const profitRateChanges = assetChanges.filter(c => c.profitLossRate !== undefined)
    const avgProfitRate = profitRateChanges.length > 0
      ? profitRateChanges.reduce((sum, c) => sum + (c.profitLossRate || 0), 0) / profitRateChanges.length
      : 0

    // 找出最佳和最差表现
    const sortedByProfit = [...assetChanges]
      .filter(c => c.profitLoss !== undefined)
      .sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0))

    const bestPerformingChange = sortedByProfit[0] || null
    const worstPerformingChange = sortedByProfit[sortedByProfit.length - 1] || null

    return {
      totalChanges,
      totalProfit,
      totalLoss,
      netProfitLoss,
      avgProfitRate,
      bestPerformingChange,
      worstPerformingChange
    }
  }

  /**
   * 获取资产变动历史（用于图表）
   */
  function getChangeHistory(assetId: string) {
    return changes.value
      .filter(c => c.assetId === assetId)
      .sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? 1 : -1)
  }

  function getCategoryById(id: string) {
    return categories.value.find(c => c.id === id)
  }

  function getCategoryTree() {
    return categories.value.filter(c => !c.parentId).map(parent => ({
      ...parent,
      children: categories.value.filter(c => c.parentId === parent.id)
    }))
  }

  // 变动类型名称映射
  const changeTypeNames: Record<AssetChangeType, string> = {
    buy: '买入',
    sell: '卖出',
    transfer_in: '转入',
    transfer_out: '转出',
    valuation_adjust: '估值调整',
    depreciation: '折旧',
    dispose: '处置'
  }

  function getChangeTypeName(type: AssetChangeType): string {
    return changeTypeNames[type] || type
  }

  return {
    // 状态
    assets,
    categories,
    changes,
    loading,
    // 计算属性
    activeAssets,
    fixedAssets,
    liquidAssets,
    investmentAssets,
    liabilities,
    statistics,
    distribution,
    // 方法
    loadAssets,
    loadCategories,
    loadChanges,
    addAsset,
    updateAsset,
    deleteAsset,
    addAssetChange,
    getCategoryById,
    getCategoryTree,
    // 变动记录方法
    recordValueChange,
    recordBuy,
    recordSell,
    recordTransferIn,
    recordTransferOut,
    recordDispose,
    getChangeStatistics,
    getChangeHistory,
    getChangeTypeName
  }
})
