"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/store/use-store"
import { Plus, Search, Filter } from "lucide-react"
import type { Asset } from "@/store/use-store"
import { useRouter } from "next/navigation"

export default function AssetsPage() {
  const router = useRouter()
  const { assets, fetchAssets, fetchAssetCategories, assetCategories, canEdit } =
    useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchAssets()
    fetchAssetCategories()
  }, [fetchAssets, fetchAssetCategories])

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || asset.categoryId === categoryFilter
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique parent categories
  const parentCategories = assetCategories.filter((c) => !c.parentId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">资产管理</h1>
            <p className="text-muted-foreground">
              管理家庭资产，跟踪价值变化
            </p>
          </div>
          {canEdit() && (
            <Button onClick={() => router.push("/assets/new")}>
              <Plus className="mr-2 h-4 w-4" />
              添加资产
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索资产..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="disposed">已处置</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "没有找到匹配的资产"
                  : "暂无资产，点击上方按钮添加"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => router.push(`/assets/${asset.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const change = asset.currentValue - asset.initialValue
  const changePercent = (change / asset.initialValue) * 100

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: asset.category.color + "20" }}
          >
            <span className="text-2xl">{asset.category.icon}</span>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              asset.status === "active"
                ? "bg-green-100 text-green-800"
                : asset.status === "disposed"
                ? "bg-gray-100 text-gray-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {asset.status === "active" ? "活跃" : asset.status === "disposed" ? "已处置" : "待处理"}
          </span>
        </div>
        <CardTitle className="text-lg">{asset.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">当前价值</span>
            <span className="text-xl font-bold">
              ¥{asset.currentValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">初始价值</span>
            <span className="text-sm">¥{asset.initialValue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">持有者</span>
            <span className="text-sm">{asset.holder.name}</span>
          </div>
          <div
            className={`flex items-center justify-between text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <span>盈亏</span>
            <span className="font-medium">
              {change >= 0 ? "+" : ""}
              {change.toLocaleString()} ({changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
