import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/assets',
    name: 'Assets',
    component: () => import('@/views/AssetsView.vue'),
    meta: { title: '资产管理' }
  },
  {
    path: '/assets/:id',
    name: 'AssetDetail',
    component: () => import('@/views/AssetDetailView.vue'),
    meta: { title: '资产详情' }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/views/TransactionsView.vue'),
    meta: { title: '收支记录' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/ReportsView.vue'),
    meta: { title: '报表分析' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：设置页面标题
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  document.title = title ? `${title} - 家庭资产管家` : '家庭资产管家'
  next()
})

export default router
