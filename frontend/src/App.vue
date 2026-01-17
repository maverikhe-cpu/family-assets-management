<script setup lang="ts">
import { h } from 'vue'
import { onMounted } from 'vue'
import { NConfigProvider, NGlobalStyle, NLayout, NLayoutSider, NLayoutContent, NMenu } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { initDB } from '@/db'
import { useAssetStore } from '@/stores/assets'
import { useTransactionStore } from '@/stores/transactions'
import { useMemberStore } from '@/stores/members'

const router = useRouter()
const route = useRoute()
const assetStore = useAssetStore()
const transactionStore = useTransactionStore()
const memberStore = useMemberStore()

const menuOptions = [
  {
    label: '仪表盘',
    key: 'Dashboard',
    icon: () => h('span', '📊')
  },
  {
    label: '资产管理',
    key: 'Assets',
    icon: () => h('span', '💰')
  },
  {
    label: '收支记录',
    key: 'Transactions',
    icon: () => h('span', '📝')
  },
  {
    label: '报表分析',
    key: 'Reports',
    icon: () => h('span', '📈')
  },
  {
    label: '设置',
    key: 'Settings',
    icon: () => h('span', '⚙️')
  }
]

onMounted(async () => {
  try {
    // 初始化数据库
    await initDB()
    // 加载数据
    await assetStore.loadCategories()
    await assetStore.loadAssets()
    await transactionStore.loadCategories()
    await transactionStore.loadTransactions()
    await memberStore.loadMembers()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

function handleMenuKey(key: string) {
  router.push({ name: key })
}
</script>

<template>
  <n-config-provider>
    <n-global-style />
    <n-layout has-sider style="height: 100vh">
      <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="64"
        :width="200"
        :native-scrollbar="false"
      >
        <div class="logo">
          <h1>家庭资产管家</h1>
        </div>
        <n-menu
          :value="route.name as string"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          @update:value="handleMenuKey"
        />
      </n-layout-sider>
      <n-layout content-style="padding: 24px; display: flex; flex-direction: column;">
        <n-layout-content style="flex: 1;">
          <router-view />
        </n-layout-content>
        <div class="footer">
          By CC
        </div>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.footer {
  text-align: center;
  padding: 16px 0;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: 24px;
}
</style>
