"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("Starting login...")

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.error("Login timeout")
          reject(new Error("登录超时，请检查网络连接"))
        }, 15000)
      )

      console.log("Calling signIn with:", { email })

      const signInPromise = signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      const result = await Promise.race([signInPromise, timeoutPromise]) as any

      console.log("SignIn result:", result)

      if (result?.error) {
        console.error("Login error:", result.error)
        setError(result.error)
      } else if (result?.ok) {
        console.log("Login successful, redirecting...")
        router.push("/dashboard")
        router.refresh()
      } else {
        console.error("Unexpected result:", result)
        setError("登录失败，请检查邮箱和密码")
      }
    } catch (err: any) {
      console.error("Login exception:", err)
      setError(err?.message || "登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">家庭资产管理</CardTitle>
          <CardDescription>登录以管理您的家庭资产</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            还没有账户？{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
