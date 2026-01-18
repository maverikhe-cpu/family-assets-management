"use client"

// Force dynamic rendering for auth pages
export const dynamic = "force-dynamic"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/store/use-store"
import { Users, Copy, Plus, Settings as SettingsIcon } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const { user, currentFamily, isOwner } = useStore()
  const router = useRouter()
  const [showCreateFamily, setShowCreateFamily] = useState(false)
  const [showJoinFamily, setShowJoinFamily] = useState(false)
  const [familyName, setFamilyName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCreateFamily = async () => {
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName }),
      })
      if (res.ok) {
        setShowCreateFamily(false)
        setFamilyName("")
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleJoinFamily = async () => {
    try {
      const res = await fetch(`/api/families/join/${inviteCode}`, {
        method: "POST",
      })
      if (res.ok) {
        setShowJoinFamily(false)
        setInviteCode("")
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const copyInviteCode = () => {
    if (currentFamily?.inviteCode) {
      navigator.clipboard.writeText(currentFamily.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground">管理账户和家庭设置</p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>邮箱</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>姓名</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>角色</Label>
              <Input value={user?.role || ""} disabled />
            </div>
            <Button variant="destructive" onClick={handleSignOut} className="mt-4">
              退出登录
            </Button>
          </CardContent>
        </Card>

        {/* Family Info */}
        {currentFamily ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>家庭信息</CardTitle>
              </div>
              <CardDescription>
                当前家庭: {currentFamily.name} ({currentFamily.memberCount} 位成员)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>邀请码</Label>
                <div className="flex gap-2">
                  <Input value={currentFamily.inviteCode || ""} disabled />
                  <Button onClick={copyInviteCode} variant="outline">
                    <Copy className="h-4 w-4" />
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/settings/family")}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                家庭设置
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>加入或创建家庭</CardTitle>
              <CardDescription>
                您还没有加入任何家庭，请创建一个或通过邀请码加入
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Dialog open={showCreateFamily} onOpenChange={setShowCreateFamily}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    创建家庭
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建新家庭</DialogTitle>
                    <DialogDescription>
                      创建一个新的家庭来管理资产
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">家庭名称</Label>
                      <Input
                        id="name"
                        placeholder="例如：张家"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateFamily}>创建</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showJoinFamily} onOpenChange={setShowJoinFamily}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    加入家庭
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>加入现有家庭</DialogTitle>
                    <DialogDescription>
                      输入邀请码加入已有家庭
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">邀请码</Label>
                      <Input
                        id="code"
                        placeholder="输入邀请码"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleJoinFamily}>加入</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
