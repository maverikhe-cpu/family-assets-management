import * as XLSX from 'xlsx'
import type { Asset, Transaction } from '@/types'
import dayjs from 'dayjs'

/**
 * 导出资产列表到 Excel
 */
export function exportAssetsToExcel(assets: Asset[], getMemberName: (id: string) => string, getCategoryName: (id: string) => string) {
  const data = assets.map(asset => {
    const member = getMemberName(asset.holderId)
    const category = getCategoryName(asset.categoryId)
    return {
      '资产名称': asset.name,
      '资产分类': category,
      '所属成员': member,
      '币种': asset.currency,
      '初始金额': asset.initialValue,
      '当前估值': asset.currentValue,
      '购买日期': dayjs(asset.purchaseDate).format('YYYY-MM-DD'),
      '状态': asset.status === 'active' ? '持有中' : asset.status === 'disposed' ? '已处置' : '待处理',
      '备注': asset.notes || ''
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '资产列表')

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 20 }, // 资产名称
    { wch: 12 }, // 资产分类
    { wch: 10 }, // 所属成员
    { wch: 8 },  // 币种
    { wch: 12 }, // 初始金额
    { wch: 12 }, // 当前估值
    { wch: 12 }, // 购买日期
    { wch: 10 }, // 状态
    { wch: 30 }  // 备注
  ]

  XLSX.writeFile(workbook, `资产列表_${dayjs().format('YYYYMMDD')}.xlsx`)
}

/**
 * 导出交易记录到 Excel
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  getMemberName: (id: string) => string,
  getCategoryName: (id: string) => string
) {
  const data = transactions.map(t => {
    const member = getMemberName(t.memberId)
    const category = getCategoryName(t.categoryId)
    return {
      '日期': dayjs(t.date).format('YYYY-MM-DD'),
      '类型': t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '转账',
      '分类': category,
      '金额': t.amount,
      '成员': member,
      '备注': t.notes || ''
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录')

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 12 }, // 日期
    { wch: 8 },  // 类型
    { wch: 12 }, // 分类
    { wch: 12 }, // 金额
    { wch: 10 }, // 成员
    { wch: 30 }  // 备注
  ]

  XLSX.writeFile(workbook, `交易记录_${dayjs().format('YYYYMMDD')}.xlsx`)
}

/**
 * 导出年度财务报告
 */
export function exportAnnualReport(params: {
  assets: Asset[]
  transactions: Transaction[]
  statistics: any
  getMemberName: (id: string) => string
  getCategoryName: (id: string) => string
}) {
  const { assets, transactions, statistics, getMemberName, getCategoryName } = params

  // 创建工作簿
  const workbook = XLSX.utils.book_new()

  // 1. 概览表
  const overviewData = [
    { '指标': '总资产', '金额': statistics.totalAssets },
    { '指标': '总负债', '金额': statistics.totalLiabilities },
    { '指标': '净资产', '金额': statistics.netWorth },
    { '指标': '流动资产', '金额': statistics.liquidAssets },
    { '指标': '固定资产', '金额': statistics.fixedAssets },
    { '指标': '投资资产', '金额': statistics.investmentAssets },
    { '指标': '负债率', '金额': statistics.liabilityRatio }
  ]
  const overviewSheet = XLSX.utils.json_to_sheet(overviewData)
  overviewSheet['!cols'] = [{ wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, overviewSheet, '资产概览')

  // 2. 资产明细表
  const assetData = assets.map(asset => ({
    '资产名称': asset.name,
    '资产分类': getCategoryName(asset.categoryId),
    '所属成员': getMemberName(asset.holderId),
    '币种': asset.currency,
    '初始金额': asset.initialValue,
    '当前估值': asset.currentValue,
    '购买日期': dayjs(asset.purchaseDate).format('YYYY-MM-DD'),
    '状态': asset.status === 'active' ? '持有中' : asset.status === 'disposed' ? '已处置' : '待处理',
    '备注': asset.notes || ''
  }))
  const assetSheet = XLSX.utils.json_to_sheet(assetData)
  assetSheet['!cols'] = [
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 30 }
  ]
  XLSX.utils.book_append_sheet(workbook, assetSheet, '资产明细')

  // 3. 交易记录表
  const transactionData = transactions.map(t => ({
    '日期': dayjs(t.date).format('YYYY-MM-DD'),
    '类型': t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '转账',
    '分类': getCategoryName(t.categoryId),
    '金额': t.amount,
    '成员': getMemberName(t.memberId),
    '备注': t.notes || ''
  }))
  const transactionSheet = XLSX.utils.json_to_sheet(transactionData)
  transactionSheet['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 30 }
  ]
  XLSX.utils.book_append_sheet(workbook, transactionSheet, '交易记录')

  // 4. 按成员统计表
  const memberStats = new Map<string, { assets: number; value: number }>()
  for (const asset of assets) {
    const member = getMemberName(asset.holderId)
    if (!memberStats.has(member)) {
      memberStats.set(member, { assets: 0, value: 0 })
    }
    const stats = memberStats.get(member)!
    stats.assets++
    stats.value += asset.currentValue
  }
  const memberData = Array.from(memberStats.entries()).map(([member, stats]) => ({
    '成员': member,
    '资产数量': stats.assets,
    '资产总额': stats.value
  }))
  const memberSheet = XLSX.utils.json_to_sheet(memberData)
  memberSheet['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, memberSheet, '成员统计')

  XLSX.writeFile(workbook, `年度财务报告_${dayjs().format('YYYY')}.xlsx`)
}

/**
 * 导出完整数据备份
 */
export function exportBackup(params: {
  assets: Asset[]
  transactions: Transaction[]
  categories: any[]
  members: any[]
  statistics: any
}) {
  const { assets, transactions, categories, members, statistics } = params

  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      assets,
      transactions,
      categories,
      members,
      statistics
    }
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `家庭资产备份_${dayjs().format('YYYYMMDD_HHmmss')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从备份文件恢复数据
 */
export async function importBackup(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
