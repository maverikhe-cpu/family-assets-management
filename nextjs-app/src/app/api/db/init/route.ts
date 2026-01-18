import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 数据库初始化和健康检查 API
 *
 * 用于在 Vercel 部署后自动创建数据库表结构
 * GET: 检查数据库连接和表是否存在
 * POST: 运行 prisma db push 创建表结构
 */

// 需要检查的表列表
const REQUIRED_TABLES = [
  "users",
  "families",
  "family_members",
  "asset_categories",
  "assets",
  "asset_changes",
  "transaction_categories",
  "transactions",
]

/**
 * 检查数据库中是否存在所有必需的表
 */
async function checkTablesExist(): Promise<boolean> {
  try {
    // 查询 PostgreSQL 信息模式检查表是否存在
    const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = ANY(${REQUIRED_TABLES} as text[])
    `
    return result.length === REQUIRED_TABLES.length
  } catch (error) {
    console.error("检查表失败:", error)
    return false
  }
}

/**
 * GET /api/db/init
 * 检查数据库状态
 */
export async function GET() {
  try {
    // 检查数据库连接
    await prisma.$connect()

    // 检查表是否存在
    const tablesExist = await checkTablesExist()

    // 检查用户数量
    let userCount = 0
    if (tablesExist) {
      userCount = await prisma.user.count()
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
      tables: tablesExist ? "created" : "missing",
      userCount,
      message: tablesExist
        ? "数据库表已创建，系统正常运行"
        : "数据库表尚未创建，需要初始化",
    })
  } catch (error) {
    console.error("数据库健康检查失败:", error)
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : "数据库连接失败",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/db/init
 * 运行 prisma db push 创建表结构
 *
 * 注意：这个操作会修改数据库结构，应该谨慎使用
 * 在生产环境中，建议通过 Vercel CLI 运行 prisma db push
 */
export async function POST(request: NextRequest) {
  try {
    // 检查请求来源（简单的安全验证）
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.INIT_SECRET_KEY || "init-secret-key"}`) {
      return NextResponse.json(
        { error: "未授权：需要提供有效的 INIT_SECRET_KEY" },
        { status: 401 }
      )
    }

    // 检查表是否已存在
    const tablesExist = await checkTablesExist()
    if (tablesExist) {
      return NextResponse.json({
        status: "ok",
        message: "数据库表已存在，无需初始化",
      })
    }

    // 运行 prisma db push
    // 注意：这里我们使用 schema 路径来推送
    const { exec } = require("child_process")
    const { promisify } = require("util")
    const execAsync = promisify(exec)

    console.log("开始运行 prisma db push...")

    // 运行 prisma db push 命令
    const { stdout, stderr } = await execAsync(
      "npx prisma db push --skip-generate --accept-data-loss",
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      }
    )

    console.log("prisma db push 输出:", stdout)
    if (stderr) {
      console.error("prisma db push 错误:", stderr)
    }

    // 验证表是否创建成功
    const tablesExistAfter = await checkTablesExist()

    return NextResponse.json({
      status: tablesExistAfter ? "success" : "partial",
      message: tablesExistAfter
        ? "数据库表创建成功"
        : "数据库初始化完成，但部分表可能未创建",
      output: stdout,
    })
  } catch (error) {
    console.error("数据库初始化失败:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "数据库初始化失败",
      },
      { status: 500 }
    )
  }
}
