"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/store/use-store"
import { useStore as useZustandStore } from "zustand/react"

export function AppHeader() {
  const { setSidebarOpen } = useStore()
  const sidebarOpen = useZustandStore(useStore, (s) => s.sidebarOpen)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h2 className="text-lg font-semibold">家庭资产管理</h2>
      </div>
    </header>
  )
}
