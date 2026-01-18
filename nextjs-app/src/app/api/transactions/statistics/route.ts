import { NextRequest } from "next/server"

// Force Node.js runtime for Prisma
export const runtime = "nodejs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFamilyAccess, apiError, apiSuccess } from "@/lib/permissions"

/**
 * 获取交易统计
 * GET /api/transactions/statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.familyId) {
      return apiError("未授权", 401)
    }

    // 验证权限
    await validateFamilyAccess(session.user.id, session.user.familyId)

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const groupBy = searchParams.get("groupBy") || "month" // month, category, member

    const where: any = {
      familyId: session.user.familyId,
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // 获取总收入和支出
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
        date: true,
        categoryId: true,
        memberId: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const incomeTransactions = transactions.filter((t) => t.type === "income")
    const expenseTransactions = transactions.filter((t) => t.type === "expense")

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const netIncome = totalIncome - totalExpense

    // 按分类统计
    const expenseByCategory: Record<
      string,
      { amount: number; count: number; color: string; icon: string; name: string }
    > = {}
    const incomeByCategory: Record<
      string,
      { amount: number; count: number; color: string; icon: string; name: string }
    > = {}

    for (const t of expenseTransactions) {
      if (!expenseByCategory[t.categoryId]) {
        expenseByCategory[t.categoryId] = {
          amount: 0,
          count: 0,
          color: t.category.color,
          icon: t.category.icon,
          name: t.category.name,
        }
      }
      expenseByCategory[t.categoryId].amount += Number(t.amount)
      expenseByCategory[t.categoryId].count++
    }

    for (const t of incomeTransactions) {
      if (!incomeByCategory[t.categoryId]) {
        incomeByCategory[t.categoryId] = {
          amount: 0,
          count: 0,
          color: t.category.color,
          icon: t.category.icon,
          name: t.category.name,
        }
      }
      incomeByCategory[t.categoryId].amount += Number(t.amount)
      incomeByCategory[t.categoryId].count++
    }

    // 按月份统计
    const monthlyStats: Record<
      string,
      { income: number; expense: number; net: number }
    > = {}

    for (const t of transactions) {
      const month = t.date.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { income: 0, expense: 0, net: 0 }
      }
      if (t.type === "income") {
        monthlyStats[month].income += Number(t.amount)
      } else if (t.type === "expense") {
        monthlyStats[month].expense += Number(t.amount)
      }
      monthlyStats[month].net = monthlyStats[month].income - monthlyStats[month].expense
    }

    return apiSuccess({
      summary: {
        totalIncome,
        totalExpense,
        netIncome,
        transactionCount: transactions.length,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
      },
      expenseByCategory: Object.values(expenseByCategory),
      incomeByCategory: Object.values(incomeByCategory),
      monthlyStats: Object.entries(monthlyStats)
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => b.month.localeCompare(a.month)),
    })
  } catch (error) {
    console.error("Get transaction statistics error:", error)
    return apiError((error as Error).message || "获取交易统计失败", 500)
  }
}
