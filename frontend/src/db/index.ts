import Dexie from 'dexie'
import type {
  Asset,
  AssetCategory,
  AssetChange,
  Transaction,
  TransactionCategory,
  Budget
} from '@/types'

// 数据库名称
const DB_NAME = 'FamilyAssetsDB'
const DB_VERSION = 1

class FamilyAssetsDB extends Dexie {
  // 资产表
  assets!: Dexie.Table<Asset>
  // 资产分类表
  assetCategories!: Dexie.Table<AssetCategory>
  // 资产变动记录表
  assetChanges!: Dexie.Table<AssetChange>
  // 交易记录表
  transactions!: Dexie.Table<Transaction>
  // 交易分类表
  transactionCategories!: Dexie.Table<TransactionCategory>
  // 预算表
  budgets!: Dexie.Table<Budget>

  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores({
      assets: 'id, categoryId, holderId, status, currentValue, purchaseDate',
      assetCategories: 'id, parentId, isBuiltin, order',
      assetChanges: 'id, assetId, type, date',
      transactions: 'id, type, categoryId, accountId, memberId, date',
      transactionCategories: 'id, type, parentId, isBuiltin, order',
      budgets: 'id, categoryId, period, year, month'
    })
  }

  // 初始化默认资产分类
  async initDefaultAssetCategories() {
    const count = await this.assetCategories.count()
    if (count > 0) return

    const now = new Date().toISOString()
    const generateId = () => `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 先创建一级分类
    const parentCategories: AssetCategory[] = [
      { id: generateId(), name: '固定资产', parentId: null, icon: '🏠', color: '#8B5CF6', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '流动资产', parentId: null, icon: '💰', color: '#10B981', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '投资资产', parentId: null, icon: '📈', color: '#F59E0B', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      { id: generateId(), name: '负债', parentId: null, icon: '📉', color: '#EF4444', isBuiltin: true, order: 4, createdAt: now, updatedAt: now }
    ]

    await this.assetCategories.bulkAdd(parentCategories)

    // 获取一级分类的 ID 映射
    const parentMap = new Map<string, string>()
    const allParents = await this.assetCategories.toArray()
    for (const p of allParents) {
      parentMap.set(p.name, p.id)
    }

    // 创建二级分类
    const childCategories: AssetCategory[] = [
      // 固定资产的子分类
      { id: generateId(), name: '房产', parentId: parentMap.get('固定资产')!, icon: '🏢', color: '#8B5CF6', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '车辆', parentId: parentMap.get('固定资产')!, icon: '🚗', color: '#8B5CF6', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '贵重物品', parentId: parentMap.get('固定资产')!, icon: '💎', color: '#8B5CF6', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      // 流动资产的子分类
      { id: generateId(), name: '现金', parentId: parentMap.get('流动资产')!, icon: '💵', color: '#10B981', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '银行存款', parentId: parentMap.get('流动资产')!, icon: '🏦', color: '#10B981', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '货币基金', parentId: parentMap.get('流动资产')!, icon: '🪙', color: '#10B981', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      // 投资资产的子分类
      { id: generateId(), name: '股票基金', parentId: parentMap.get('投资资产')!, icon: '📊', color: '#F59E0B', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '保险', parentId: parentMap.get('投资资产')!, icon: '🛡️', color: '#F59E0B', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '债券', parentId: parentMap.get('投资资产')!, icon: '📜', color: '#F59E0B', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      { id: generateId(), name: '数字货币', parentId: parentMap.get('投资资产')!, icon: '₿', color: '#F59E0B', isBuiltin: true, order: 4, createdAt: now, updatedAt: now },
      // 负债的子分类
      { id: generateId(), name: '房贷', parentId: parentMap.get('负债')!, icon: '🏠', color: '#EF4444', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '车贷', parentId: parentMap.get('负债')!, icon: '🚗', color: '#EF4444', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '信用卡欠款', parentId: parentMap.get('负债')!, icon: '💳', color: '#EF4444', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      { id: generateId(), name: '其他借款', parentId: parentMap.get('负债')!, icon: '📝', color: '#EF4444', isBuiltin: true, order: 4, createdAt: now, updatedAt: now }
    ]

    await this.assetCategories.bulkAdd(childCategories)
  }

  // 初始化默认交易分类
  async initDefaultTransactionCategories() {
    const count = await this.transactionCategories.count()
    if (count > 0) return

    const now = new Date().toISOString()
    const generateId = () => `tcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const incomeCategories: TransactionCategory[] = [
      { id: generateId(), name: '工资', type: 'income', parentId: null, icon: '💼', color: '#10B981', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '奖金', type: 'income', parentId: null, icon: '🎁', color: '#10B981', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '投资收益', type: 'income', parentId: null, icon: '📈', color: '#10B981', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      { id: generateId(), name: '兼职收入', type: 'income', parentId: null, icon: '💰', color: '#10B981', isBuiltin: true, order: 4, createdAt: now, updatedAt: now },
      { id: generateId(), name: '其他收入', type: 'income', parentId: null, icon: '📥', color: '#10B981', isBuiltin: true, order: 5, createdAt: now, updatedAt: now }
    ]

    const expenseCategories: TransactionCategory[] = [
      { id: generateId(), name: '餐饮', type: 'expense', parentId: null, icon: '🍜', color: '#F59E0B', isBuiltin: true, order: 1, createdAt: now, updatedAt: now },
      { id: generateId(), name: '交通', type: 'expense', parentId: null, icon: '🚗', color: '#F59E0B', isBuiltin: true, order: 2, createdAt: now, updatedAt: now },
      { id: generateId(), name: '购物', type: 'expense', parentId: null, icon: '🛍️', color: '#F59E0B', isBuiltin: true, order: 3, createdAt: now, updatedAt: now },
      { id: generateId(), name: '娱乐', type: 'expense', parentId: null, icon: '🎮', color: '#F59E0B', isBuiltin: true, order: 4, createdAt: now, updatedAt: now },
      { id: generateId(), name: '医疗', type: 'expense', parentId: null, icon: '💊', color: '#F59E0B', isBuiltin: true, order: 5, createdAt: now, updatedAt: now },
      { id: generateId(), name: '教育', type: 'expense', parentId: null, icon: '📚', color: '#F59E0B', isBuiltin: true, order: 6, createdAt: now, updatedAt: now },
      { id: generateId(), name: '居住', type: 'expense', parentId: null, icon: '🏠', color: '#F59E0B', isBuiltin: true, order: 7, createdAt: now, updatedAt: now },
      { id: generateId(), name: '通讯', type: 'expense', parentId: null, icon: '📱', color: '#F59E0B', isBuiltin: true, order: 8, createdAt: now, updatedAt: now },
      { id: generateId(), name: '其他支出', type: 'expense', parentId: null, icon: '📤', color: '#F59E0B', isBuiltin: true, order: 9, createdAt: now, updatedAt: now }
    ]

    await this.transactionCategories.bulkAdd([...incomeCategories, ...expenseCategories])
  }
}

export const db = new FamilyAssetsDB()

// 初始化数据库
export async function initDB() {
  await db.open()
  await db.initDefaultAssetCategories()
  await db.initDefaultTransactionCategories()
}

// 导入资产数据（支持成员导入）
export async function importAssets(assets: any[]) {
  const categories = await db.assetCategories.toArray()

  // 创建分类名称到ID的映射
  const categoryNameToId = new Map<string, string>()
  for (const cat of categories) {
    categoryNameToId.set(cat.name, cat.id)
  }

  // 提取唯一的成员名称
  const memberNames = new Set<string>()
  for (const asset of assets) {
    if (asset.holderName) {
      memberNames.add(asset.holderName)
    }
  }

  // 成员名称映射（将Excel中的成员名映射到系统成员名）
  const memberNameMapping: Record<string, string> = {
    '我': '本人'
  }

  // 创建或获取成员
  const memberNameToId = new Map<string, string>()
  const existingMembers = JSON.parse(localStorage.getItem('family_members') || '[]')
  const memberColors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

  let colorIndex = 0
  for (const memberName of memberNames) {
    // 使用映射后的成员名称
    const mappedName = memberNameMapping[memberName] || memberName

    // 查找是否已存在同名成员
    let member = existingMembers.find((m: any) => m.name === mappedName)
    if (!member) {
      // 创建新成员
      const newMember = {
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: mappedName,
        role: 'other' as const,
        color: memberColors[colorIndex % memberColors.length],
        order: existingMembers.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      existingMembers.push(newMember)
      member = newMember
      colorIndex++
    }
    // 使用原始名称映射到成员ID
    memberNameToId.set(memberName, member.id)
  }

  // 保存成员到 localStorage
  localStorage.setItem('family_members', JSON.stringify(existingMembers))

  // 导入资产
  const assetsToAdd: Asset[] = []
  const now = new Date().toISOString()

  for (const asset of assets) {
    const categoryId = categoryNameToId.get(asset.categoryName)
    if (!categoryId) {
      console.warn(`分类不存在: ${asset.categoryName}`)
      continue
    }

    // 获取成员ID，如果没有则使用默认成员
    const holderId = memberNameToId.get(asset.holderName) || 'member_owner'

    assetsToAdd.push({
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: asset.name,
      categoryId,
      holderId,
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      currency: asset.currency,
      purchaseDate: asset.purchaseDate,
      status: asset.status || 'active',
      notes: asset.notes,
      createdAt: now,
      updatedAt: now
    })
  }

  await db.assets.bulkAdd(assetsToAdd)
  return assetsToAdd.length
}
