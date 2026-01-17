<script setup lang="ts">
import { h, computed, ref } from 'vue'
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

// 侧边栏状态
const collapsed = ref(false)

// 检测移动端
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  collapsed.value = isMobile.value
}

// 主题配置
const theme = null
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

// 侧边栏宽度
const siderWidth = computed(() => isMobile.value ? 0 : 220)

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

  // 检测移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

function handleMenuKey(key: string) {
  router.push({ name: key })
  // 移动端点击菜单后自动收起
  if (isMobile.value) {
    collapsed.value = true
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="inlineThemeOverrides">
    <n-global-style />
    <n-layout has-sider class="app-layout">
      <!-- 侧边栏 -->
      <n-layout-sider
        v-if="!isMobile || !collapsed"
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed="collapsed"
        :collapsed-width="isMobile ? 0 : 64"
        :width="siderWidth"
        :native-scrollbar="false"
        class="app-sider"
        @update:collapsed="isMobile ? toggleCollapsed() : undefined"
      >
        <div class="logo">
          <span class="logo-icon">💎</span>
          <h1 v-show="!collapsed" class="logo-title">家庭资产管家</h1>
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

      <!-- 移动端顶部栏 -->
      <div v-if="isMobile" class="mobile-header">
        <button class="menu-toggle" @click="toggleCollapsed">
          <span v-if="collapsed">☰</span>
          <span v-else>✕</span>
        </button>
        <h1 class="mobile-title">家庭资产管家</h1>
        <div class="mobile-spacer"></div>
      </div>

      <!-- 主内容区 -->
      <n-layout-content class="app-content" :class="{ 'app-content--mobile': isMobile }">
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
  z-index: 100;
  transition: transform 0.3s ease;
}

@media (max-width: 767px) {
  .app-sider {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .app-sider:not([style*="width: 0px"]) {
    transform: translateX(0);
  }
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
  flex-shrink: 0;
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

/* 移动端顶部栏 */
.mobile-header {
  display: none;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--n-text-color);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.menu-toggle:active {
  background: var(--n-color-modal);
}

.mobile-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.mobile-spacer {
  width: 36px;
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

/* 移动端适配 */
@media (max-width: 767px) {
  .mobile-header {
    display: flex;
  }

  .app-content--mobile {
    padding-top: 0;
  }

  .content-wrapper {
    padding: var(--spacing-md);
  }

  .footer {
    padding: var(--spacing-sm) 0;
    font-size: 11px;
  }
}

/* 遮罩层 */
@media (max-width: 767px) {
  .app-sider:not([style*="width: 0px"])::before {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}
</style>
