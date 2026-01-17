// 家庭成员
export interface Member {
  id: string
  name: string
  avatar?: string
  role: 'owner' | 'spouse' | 'child' | 'other'
  color: string
  order: number
  createdAt: string
  updatedAt: string
}

// 资产分类
export interface AssetCategory {
  id: string
  name: string
  parentId: string | null
  icon: string
  color: string
  isBuiltin: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// 资产状态
export type AssetStatus = 'active' | 'disposed' | 'pending'

// 资产卡片
export interface Asset {
  id: string
  name: string
  categoryId: string
  holderId: string
  initialValue: number
  currentValue: number
  currency: string
  purchaseDate: string
  status: AssetStatus
  notes?: string
  // 扩展属性（动态字段）
  attributes?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 资产变动类型
export type AssetChangeType =
  | 'buy'           // 购入
  | 'sell'          // 卖出
  | 'transfer_in'   // 转入
  | 'transfer_out'  // 转出
  | 'valuation_adjust'  // 估值调整
  | 'depreciation'  // 折旧
  | 'dispose'       // 处置

// 资产变动记录
export interface AssetChange {
  id: string
  assetId: string
  type: AssetChangeType
  amount: number
  beforeValue: number
  afterValue: number
  profitLoss?: number  // 盈亏金额
  profitLossRate?: number  // 盈亏率百分比
  relatedTransactionId?: string
  relatedAssetId?: string
  date: string
  notes?: string
  createdAt: string
}

// 资产统计（扩展）
export interface AssetChangeStatistics {
  totalChanges: number
  totalProfit: number
  totalLoss: number
  netProfitLoss: number
  avgProfitRate: number
  bestPerformingChange: AssetChange | null
  worstPerformingChange: AssetChange | null
}

// 收支分类
export interface TransactionCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  isBuiltin: boolean
  parentId: string | null
  order: number
  createdAt: string
  updatedAt: string
}

// 交易类型
export type TransactionType = 'income' | 'expense' | 'transfer'

// 交易记录
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  accountId: string
  memberId: string
  date: string
  notes?: string
  tags?: string[]
  relatedAssetId?: string
  createdAt: string
  updatedAt: string
}

// 预算
export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'yearly'
  year: number
  month?: number
  createdAt: string
  updatedAt: string
}

// 统计数据
export interface AssetStatistics {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  liquidAssets: number
  fixedAssets: number
  investmentAssets: number
  liabilityRatio: number
}

// 资产分布
export interface AssetDistribution {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
  color: string
}

// 趋势数据点
export interface TrendDataPoint {
  date: string
  totalAssets: number
  netWorth: number
}
