import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据...')

  // 创建默认用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  })
  console.log('创建用户:', user.email)

  // 创建默认家庭
  const family = await prisma.family.upsert({
    where: { id: 'default-family' },
    update: {},
    create: {
      id: 'default-family',
      name: '我的家庭',
      description: '默认家庭',
      createdBy: user.id,
      inviteCode: 'DEFAULT123',
    },
  })
  console.log('创建家庭:', family.name)

  // 添加用户到家庭
  const familyMember = await prisma.familyMember.upsert({
    where: {
      id: 'default-member',
    },
    update: {},
    create: {
      id: 'default-member',
      familyId: family.id,
      userId: user.id,
      role: 'owner',
    },
  })
  console.log('添加家庭成员:', familyMember.id)

  // 更新用户的当前家庭
  await prisma.user.update({
    where: { id: user.id },
    data: { familyId: family.id },
  })

  // 创建默认资产分类 (二级分类)
  // 固定资产
  const fixedAssetsCategory = await prisma.assetCategory.create({
    data: {
      name: '固定资产',
      familyId: family.id,
      icon: '🏠',
      color: '#3b82f6',
      isBuiltin: true,
      order: 1,
    },
  })

  await prisma.assetCategory.createMany({
    data: [
      { name: '房产', parentId: fixedAssetsCategory.id, familyId: family.id, icon: '🏠', color: '#3b82f6', isBuiltin: true, order: 1 },
      { name: '车辆', parentId: fixedAssetsCategory.id, familyId: family.id, icon: '🚗', color: '#3b82f6', isBuiltin: true, order: 2 },
      { name: '家具家电', parentId: fixedAssetsCategory.id, familyId: family.id, icon: '🛋️', color: '#3b82f6', isBuiltin: true, order: 3 },
    ],
  })

  // 流动资产
  const liquidAssetsCategory = await prisma.assetCategory.create({
    data: {
      name: '流动资产',
      familyId: family.id,
      icon: '💵',
      color: '#22c55e',
      isBuiltin: true,
      order: 2,
    },
  })

  await prisma.assetCategory.createMany({
    data: [
      { name: '现金', parentId: liquidAssetsCategory.id, familyId: family.id, icon: '💵', color: '#22c55e', isBuiltin: true, order: 1 },
      { name: '银行存款', parentId: liquidAssetsCategory.id, familyId: family.id, icon: '🏦', color: '#22c55e', isBuiltin: true, order: 2 },
      { name: '余额宝', parentId: liquidAssetsCategory.id, familyId: family.id, icon: '💰', color: '#22c55e', isBuiltin: true, order: 3 },
    ],
  })

  // 投资资产
  const investmentAssetsCategory = await prisma.assetCategory.create({
    data: {
      name: '投资资产',
      familyId: family.id,
      icon: '📈',
      color: '#f59e0b',
      isBuiltin: true,
      order: 3,
    },
  })

  await prisma.assetCategory.createMany({
    data: [
      { name: '股票', parentId: investmentAssetsCategory.id, familyId: family.id, icon: '📈', color: '#f59e0b', isBuiltin: true, order: 1 },
      { name: '基金', parentId: investmentAssetsCategory.id, familyId: family.id, icon: '📊', color: '#f59e0b', isBuiltin: true, order: 2 },
      { name: '债券', parentId: investmentAssetsCategory.id, familyId: family.id, icon: '📜', color: '#f59e0b', isBuiltin: true, order: 3 },
    ],
  })

  // 负债
  const liabilitiesCategory = await prisma.assetCategory.create({
    data: {
      name: '负债',
      familyId: family.id,
      icon: '📉',
      color: '#ef4444',
      isBuiltin: true,
      order: 4,
    },
  })

  await prisma.assetCategory.createMany({
    data: [
      { name: '房贷', parentId: liabilitiesCategory.id, familyId: family.id, icon: '🏠', color: '#ef4444', isBuiltin: true, order: 1 },
      { name: '车贷', parentId: liabilitiesCategory.id, familyId: family.id, icon: '🚗', color: '#ef4444', isBuiltin: true, order: 2 },
      { name: '信用卡', parentId: liabilitiesCategory.id, familyId: family.id, icon: '💳', color: '#ef4444', isBuiltin: true, order: 3 },
    ],
  })

  console.log('创建默认资产分类')

  // 创建默认交易分类
  // 收入分类
  const incomeCategory = await prisma.transactionCategory.create({
    data: {
      name: '收入',
      type: 'income',
      familyId: family.id,
      icon: '💰',
      color: '#22c55e',
      isBuiltin: true,
      order: 1,
    },
  })

  await prisma.transactionCategory.createMany({
    data: [
      { name: '工资', parentId: incomeCategory.id, type: 'income', familyId: family.id, icon: '💼', color: '#22c55e', isBuiltin: true, order: 1 },
      { name: '奖金', parentId: incomeCategory.id, type: 'income', familyId: family.id, icon: '🎁', color: '#22c55e', isBuiltin: true, order: 2 },
      { name: '投资收益', parentId: incomeCategory.id, type: 'income', familyId: family.id, icon: '📈', color: '#22c55e', isBuiltin: true, order: 3 },
      { name: '其他收入', parentId: incomeCategory.id, type: 'income', familyId: family.id, icon: '💵', color: '#22c55e', isBuiltin: true, order: 4 },
    ],
  })

  // 支出分类
  const expenseCategory = await prisma.transactionCategory.create({
    data: {
      name: '支出',
      type: 'expense',
      familyId: family.id,
      icon: '💸',
      color: '#ef4444',
      isBuiltin: true,
      order: 2,
    },
  })

  await prisma.transactionCategory.createMany({
    data: [
      { name: '餐饮', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '🍔', color: '#ef4444', isBuiltin: true, order: 1 },
      { name: '交通', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '🚗', color: '#ef4444', isBuiltin: true, order: 2 },
      { name: '购物', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '🛒', color: '#ef4444', isBuiltin: true, order: 3 },
      { name: '娱乐', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '🎮', color: '#ef4444', isBuiltin: true, order: 4 },
      { name: '医疗', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '💊', color: '#ef4444', isBuiltin: true, order: 5 },
      { name: '教育', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '📚', color: '#ef4444', isBuiltin: true, order: 6 },
      { name: '其他支出', parentId: expenseCategory.id, type: 'expense', familyId: family.id, icon: '📦', color: '#ef4444', isBuiltin: true, order: 7 },
    ],
  })

  console.log('创建默认交易分类')
  console.log('种子数据完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
