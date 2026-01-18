"use client"

// Force dynamic rendering for auth pages
export const dynamic = "force-dynamic"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/store/use-store"
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react"

export default function DashboardPage() {
  const { assets, fetchAssets, fetchAssetCategories, assetCategories } = useStore()

  useEffect(() => {
    fetchAssets()
    fetchAssetCategories()
  }, [fetchAssets, fetchAssetCategories])

  // Calculate statistics
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0)
  const activeAssets = assets.filter((a) => a.status === "active").length

  // Group by category
  const categoryGroups = assets.reduce((acc, asset) => {
    const cat = asset.category.name
    if (!acc[cat]) {
      acc[cat] = { count: 0, value: 0, color: asset.category.color, icon: asset.category.icon }
    }
    acc[cat].count++
    acc[cat].value += asset.currentValue
    return acc
  }, {} as Record<string, { count: number; value: number; color: string; icon: string }>)

  const categoryStats = Object.entries(categoryGroups).map(([name, data]) => ({
    name,
    ...data,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">家庭资产概览</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总资产</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{totalAssets.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">资产数量</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAssets}</div>
              <p className="text-xs text-muted-foreground">
                共 {assets.length} 个资产
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">资产分类</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryStats.length}</div>
              <p className="text-xs text-muted-foreground">
                个分类
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月交易</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                笔交易
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>资产分布</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无资产数据</p>
              ) : (
                <div className="space-y-4">
                  {categoryStats.map((cat) => {
                    const percentage = totalAssets > 0 ? (cat.value / totalAssets) * 100 : 0
                    return (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </div>
                          <div className="text-muted-foreground">
                            ¥{cat.value.toLocaleString()}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近资产</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无资产</p>
              ) : (
                <div className="space-y-4">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: asset.category.color + "20" }}
                        >
                          <span>{asset.category.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.holder.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ¥{asset.currentValue.toLocaleString()}
                        </p>
                        <p
                          className={`text-xs ${
                            asset.currentValue >= asset.initialValue
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {asset.currentValue >= asset.initialValue ? "+" : ""}
                          {((asset.currentValue - asset.initialValue) / asset.initialValue * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
