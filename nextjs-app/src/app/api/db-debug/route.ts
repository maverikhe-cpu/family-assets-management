import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userCount = await prisma.user.count()

    const dbSchema = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `

    return NextResponse.json({
      userCount,
      currentDatabase: dbSchema[0]?.current_database || "unknown",
      timestamp: new Date().toISOString(),
      envCheck: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPrismaUrl: !!process.env.PRISMA_DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        prismaUrlLength: process.env.PRISMA_DATABASE_URL?.length || 0,
      }
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Database debug failed",
      },
      { status: 500 }
    )
  }
}
