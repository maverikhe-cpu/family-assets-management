<script setup lang="ts">
import { h, computed } from 'vue'
import { onMounted } from 'vue'
import {
  NConfigProvider, NGlobalStyle, NLayout, NLayoutSider,
  NLayoutContent, NMenu
} from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { initDB } from '@/db'
import { useAssetStore } from '@/stores/assets'
import { useTransactionStore } from '@/stores/transactions'
import { useMemberStore } from '@/stores/members'
import { themeOverrides } from '@/theme'

const router = useRouter()
const route = useRoute()
const assetStore = useAssetStore()
const transactionStore = useTransactionStore()
const memberStore = useMemberStore()

// 主题配置
const theme = null // 使用亮色主题
const inlineThemeOverrides = themeOverrides

// 菜单选项
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

// 当前选中的菜单
const activeKey = computed(() => route.name as string)

onMounted(async () => {
  try {
    await initDB()
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
  <n-config-provider :theme="theme" :theme-overrides="inlineThemeOverrides">
    <n-global-style />
    <n-layout has-sider class="app-layout">
      <!-- 侧边栏 -->
      <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="64"
        :width="220"
        :native-scrollbar="false"
        class="app-sider"
      >
        <div class="logo">
          <span class="logo-icon">💎</span>
          <h1 class="logo-title">家庭资产管家</h1>
        </div>
        <n-menu
          :value="activeKey"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          @update:value="handleMenuKey"
          class="app-menu"
        />
      </n-layout-sider>

      <!-- 主内容区 -->
      <n-layout-content class="app-content">
        <div class="content-wrapper">
          <router-view />
        </div>
        <div class="footer">
          家庭资产管家 v1.0 · By CC
        </div>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.app-layout {
  height: 100vh;
}

/* 侧边栏样式 */
.app-sider {
  background: var(--n-color);
  position: relative;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--n-gap);
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid var(--n-border-color);
}

.logo-icon {
  font-size: 24px;
  line-height: 1;
}

.logo-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  color: var(--n-text-color);
}

.app-menu {
  padding: var(--spacing-md) 0;
}

/* 主内容区样式 */
.app-content {
  background: var(--n-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xxl);
}

.footer {
  text-align: center;
  padding: var(--spacing-lg) 0;
  color: var(--n-text-color-3);
  font-size: var(--font-xs);
  border-top: 1px solid var(--n-border-color);
  flex-shrink: 0;
}
</style>
