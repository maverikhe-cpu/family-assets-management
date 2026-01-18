import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 检查数据库表是否存在
 */
async function checkDatabaseTables(): Promise<boolean> {
  try {
    // 尝试查询 User 表来验证数据库是否已初始化
    await prisma.user.findFirst()
    return true
  } catch (error: any) {
    // 检查错误消息是否表明表不存在
    if (
      error.code === "P2021" || // Prisma table not found
      error.message?.includes("relation") ||
      error.message?.includes("does not exist")
    ) {
      return false
    }
    // 其他错误也返回 false
    return false
  }
}

/**
 * 获取用户的家庭列表
 * GET /api/families
 */
export async function GET(req: NextRequest) {
  try {
    // 检查数据库是否已初始化
    const dbReady = await checkDatabaseTables()
    if (!dbReady) {
      return NextResponse.json(
        {
          error: "DATABASE_NOT_INITIALIZED",
          message: "数据库尚未初始化。请访问 /api/db/init 查看详情",
          needsInit: true,
        },
        { status: 503 }
      )
    }

    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const memberships = await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      include: {
        family: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    const families = memberships.map((m) => ({
      id: m.family.id,
      name: m.family.name,
      description: m.family.description,
      inviteCode: m.family.inviteCode,
      role: m.role,
      memberCount: m.family._count.members,
      createdAt: m.family.createdAt,
    }))

    return apiSuccess({ families })
  } catch (error) {
    console.error("Get families error:", error)
    return apiError("获取家庭列表失败", 500)
  }
}

/**
 * 创建新家庭
 * POST /api/families
 */
export async function POST(req: NextRequest) {
  try {
    // 检查数据库是否已初始化
    const dbReady = await checkDatabaseTables()
    if (!dbReady) {
      return NextResponse.json(
        {
          error: "DATABASE_NOT_INITIALIZED",
          message: "数据库尚未初始化。请先运行数据库初始化命令",
          needsInit: true,
          instructions: [
            "方法 1: 在本地运行 npx prisma db push",
            "方法 2: 在 Vercel 项目设置中添加环境变量后重新部署",
          ],
        },
        { status: 503 }
      )
    }

    const session = await auth()

    if (!session?.user?.id) {
      return apiError("未授权", 401)
    }

    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return apiError("家庭名称必填")
    }

    // 生成邀请码
    const inviteCode = nanoid(8).toUpperCase()

    // 创建家庭
    const family = await prisma.family.create({
      data: {
        name,
        description,
        createdBy: session.user.id,
        inviteCode,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    })

    // 更新用户的当前家庭
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    })

    // 创建默认资产分类
    const fixedCategory = await prisma.assetCategory.create({
      data: {
        name: "固定资产",
        familyId: family.id,
        icon: "🏠",
        color: "#3b82f6",
        isBuiltin: true,
        order: 1,
      },
    })

    await prisma.assetCategory.createMany({
      data: [
        { name: "房产", parentId: fixedCategory.id, familyId: family.id, icon: "🏠", color: "#3b82f6", isBuiltin: true, order: 1 },
        { name: "车辆", parentId: fixedCategory.id, familyId: family.id, icon: "🚗", color: "#3b82f6", isBuiltin: true, order: 2 },
        { name: "家具家电", parentId: fixedCategory.id, familyId: family.id, icon: "🛋️", color: "#3b82f6", isBuiltin: true, order: 3 },
      ],
    })

    const liquidCategory = await prisma.assetCategory.create({
      data: {
        name: "流动资产",
        familyId: family.id,
        icon: "💵",
        color: "#22c55e",
        isBuiltin: true,
        order: 2,
      },
    })

    await prisma.assetCategory.createMany({
      data: [
        { name: "现金", parentId: liquidCategory.id, familyId: family.id, icon: "💵", color: "#22c55e", isBuiltin: true, order: 1 },
        { name: "银行存款", parentId: liquidCategory.id, familyId: family.id, icon: "🏦", color: "#22c55e", isBuiltin: true, order: 2 },
        { name: "余额宝", parentId: liquidCategory.id, familyId: family.id, icon: "💰", color: "#22c55e", isBuiltin: true, order: 3 },
      ],
    })

    const investmentCategory = await prisma.assetCategory.create({
      data: {
        name: "投资资产",
        familyId: family.id,
        icon: "📈",
        color: "#f59e0b",
        isBuiltin: true,
        order: 3,
      },
    })

    await prisma.assetCategory.createMany({
      data: [
        { name: "股票", parentId: investmentCategory.id, familyId: family.id, icon: "📈", color: "#f59e0b", isBuiltin: true, order: 1 },
        { name: "基金", parentId: investmentCategory.id, familyId: family.id, icon: "📊", color: "#f59e0b", isBuiltin: true, order: 2 },
        { name: "债券", parentId: investmentCategory.id, familyId: family.id, icon: "📜", color: "#f59e0b", isBuiltin: true, order: 3 },
      ],
    })

    const liabilitiesCategory = await prisma.assetCategory.create({
      data: {
        name: "负债",
        familyId: family.id,
        icon: "📉",
        color: "#ef4444",
        isBuiltin: true,
        order: 4,
      },
    })

    await prisma.assetCategory.createMany({
      data: [
        { name: "房贷", parentId: liabilitiesCategory.id, familyId: family.id, icon: "🏠", color: "#ef4444", isBuiltin: true, order: 1 },
        { name: "车贷", parentId: liabilitiesCategory.id, familyId: family.id, icon: "🚗", color: "#ef4444", isBuiltin: true, order: 2 },
        { name: "信用卡", parentId: liabilitiesCategory.id, familyId: family.id, icon: "💳", color: "#ef4444", isBuiltin: true, order: 3 },
      ],
    })

    // 创建默认交易分类
    const incomeCategory = await prisma.transactionCategory.create({
      data: {
        name: "收入",
        type: "income",
        familyId: family.id,
        icon: "💰",
        color: "#22c55e",
        isBuiltin: true,
        order: 1,
      },
    })

    await prisma.transactionCategory.createMany({
      data: [
        { name: "工资", parentId: incomeCategory.id, type: "income", familyId: family.id, icon: "💼", color: "#22c55e", isBuiltin: true, order: 1 },
        { name: "奖金", parentId: incomeCategory.id, type: "income", familyId: family.id, icon: "🎁", color: "#22c55e", isBuiltin: true, order: 2 },
        { name: "投资收益", parentId: incomeCategory.id, type: "income", familyId: family.id, icon: "📈", color: "#22c55e", isBuiltin: true, order: 3 },
        { name: "其他收入", parentId: incomeCategory.id, type: "income", familyId: family.id, icon: "💵", color: "#22c55e", isBuiltin: true, order: 4 },
      ],
    })

    const expenseCategory = await prisma.transactionCategory.create({
      data: {
        name: "支出",
        type: "expense",
        familyId: family.id,
        icon: "💸",
        color: "#ef4444",
        isBuiltin: true,
        order: 2,
      },
    })

    await prisma.transactionCategory.createMany({
      data: [
        { name: "餐饮", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "🍔", color: "#ef4444", isBuiltin: true, order: 1 },
        { name: "交通", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "🚗", color: "#ef4444", isBuiltin: true, order: 2 },
        { name: "购物", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "🛒", color: "#ef4444", isBuiltin: true, order: 3 },
        { name: "娱乐", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "🎮", color: "#ef4444", isBuiltin: true, order: 4 },
        { name: "医疗", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "💊", color: "#ef4444", isBuiltin: true, order: 5 },
        { name: "教育", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "📚", color: "#ef4444", isBuiltin: true, order: 6 },
        { name: "其他支出", parentId: expenseCategory.id, type: "expense", familyId: family.id, icon: "📦", color: "#ef4444", isBuiltin: true, order: 7 },
      ],
    })

    return apiSuccess({ family, message: "创建成功" }, 201)
  } catch (error) {
    console.error("Create family error:", error)
    return apiError("创建家庭失败", 500)
  }
}
