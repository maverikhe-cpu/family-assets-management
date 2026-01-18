import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // 检查是否有家庭
    const token = req.nextauth.token
    const url = req.nextUrl.pathname

    // 如果用户已登录但没有家庭，重定向到创建/加入家庭页面
    if (token && !token.familyId && !url.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

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
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth|onboarding|api/auth).*)",
  ],
}
