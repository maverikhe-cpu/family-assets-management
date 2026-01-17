import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from './DashboardView.vue'
import { useAssetStore } from '@/stores/assets'
import { useTransactionStore } from '@/stores/transactions'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, name: 'Dashboard' }),
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock components
vi.mock('@/components/AssetDistributionChart.vue', () => ({
  default: {
    name: 'AssetDistributionChart',
    template: '<div class="mock-chart">Chart</div>',
  },
}))

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders dashboard title', () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          NCard: { template: '<div class="n-card"><slot /></div>' },
          NSpace: { template: '<div class="n-space"><slot /></div>' },
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NButton: { template: '<button><slot /></button>' },
          NEmpty: { template: '<div class="n-empty"><slot /><slot name="extra" /></div>' },
          AssetDistributionChart: { template: '<div class="mock-chart" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('仪表盘')
    expect(wrapper.text()).toContain('家庭资产概览')
  })

  it('shows empty state when no assets', () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          NCard: { template: '<div class="n-card"><slot /><slot name="header-extra" /></div>' },
          NSpace: { template: '<div class="n-space"><slot /></div>' },
          NEmpty: { template: '<div class="n-empty"><slot /><slot name="extra" /></div>' },
          NButton: { template: '<button><slot /></button>' },
        },
      },
    })

    expect(wrapper.text()).toContain('还没有资产数据')
  })

  it('displays statistics when assets exist', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const assetStore = useAssetStore()
    assetStore.assets = [
      {
        id: '1',
        name: 'Test Asset',
        categoryId: 'cat_1',
        holderId: 'user_1',
        initialValue: 1000,
        currentValue: 1500,
        currency: 'CNY',
        purchaseDate: '2024-01-01',
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    assetStore.categories = [
      {
        id: '流动资产',
        name: '流动资产',
        parentId: null,
        icon: '💰',
        color: '#10B981',
        isBuiltin: true,
        order: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'cat_1',
        name: '银行存款',
        parentId: '流动资产',
        icon: '🏦',
        color: '#10B981',
        isBuiltin: true,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [pinia],
        stubs: {
          NCard: { template: '<div class="n-card"><slot /></div>' },
          NSpace: { template: '<div class="n-space"><slot /></div>' },
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NButton: { template: '<button><slot /></button>' },
          NNumberAnimation: { template: '<span><slot /></span>' },
          AssetDistributionChart: { template: '<div class="mock-chart" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('总资产')
  })
})
