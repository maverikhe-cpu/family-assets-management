import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    return NextResponse.json({
      authenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Auth check failed",
      },
      { status: 500 }
    )
  }
}
