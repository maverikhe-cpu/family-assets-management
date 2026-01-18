"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DatabaseCheckResult {
  status: string
  database: string
  tables: string
  message: string
}

export function DatabaseInitAlert() {
  const [dbStatus, setDbStatus] = useState<DatabaseCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检查是否已经忽略过这个提示
    const dismissedTime = localStorage.getItem("db-init-dismissed")
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime)
      // 24小时内不再显示
      if (elapsed < 24 * 60 * 60 * 1000) {
        setLoading(false)
        return
      }
    }

    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      const res = await fetch("/api/db/init")
      const data = await res.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({
        status: "error",
        database: "unknown",
        tables: "unknown",
        message: "无法连接到数据库",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("db-init-dismissed", Date.now().toString())
  }

  if (loading || dismissed || !dbStatus) {
    return null
  }

  // 数据库正常，不显示提示
  if (dbStatus.tables === "created") {
    return null
  }

  // 数据库未初始化，显示提示
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>数据库未初始化</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{dbStatus.message}</p>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">解决方法：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              在 Vercel 项目中打开设置 {"->"} Environment Variables
            </li>
            <li>
              确保 <code className="bg-background px-1 rounded">DATABASE_URL</code> 已正确配置
            </li>
            <li>
              在本地运行：{" "}
              <code className="bg-background px-1 rounded">
                npx prisma db push --skip-generate
              </code>
            </li>
            <li>
              或者访问 Vercel 项目 {"->"} Settings {"->"} Database {"->"} Query
            </li>
          </ol>
        </div>
        <button
          onClick={handleDismiss}
          className="mt-3 text-xs underline hover:no-underline"
        >
          24小时内不再显示此提示
        </button>
      </AlertDescription>
    </Alert>
  )
}
