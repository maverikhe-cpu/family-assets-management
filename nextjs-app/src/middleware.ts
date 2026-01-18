import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  // 检查是否有 session cookie (简单验证，不解析 JWT)
  const hasSession = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token")

  // 检查是否需要认证
  const isAuthPage = url.startsWith("/auth")
  const isOnboardingPage = url.startsWith("/onboarding")
  const isApiAuth = url.startsWith("/api/auth")
  const isPublicApi = url.startsWith("/api/db/init")

  // 如果未登录且不是公开页面，重定向到登录页
  if (!hasSession && !isAuthPage && !isOnboardingPage && !isApiAuth && !isPublicApi) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - /auth/* (auth pages)
     * - /onboarding (onboarding pages)
     * - /api/auth (NextAuth API)
     * - /api/db/init (db health check)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth|onboarding|api/auth|api/db).*)",
  ],
}
