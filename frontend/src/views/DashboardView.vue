<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NSpace, NButton, NEmpty } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import AssetDistributionChart from '@/components/AssetDistributionChart.vue'

const assetStore = useAssetStore()

const stats = computed(() => assetStore.statistics)
const distribution = computed(() => assetStore.distribution)
const hasAssets = computed(() => assetStore.activeAssets.length > 0)

const BASE_CURRENCY = 'CNY'
const currencySymbol = computed(() => {
  const symbols: Record<string, string> = { CNY: '¥', USD: '$', HKD: 'HK$', GBP: '£', EUR: '€' }
  return symbols[BASE_CURRENCY] || BASE_CURRENCY
})

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatInteger(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
</script>

<template>
  <div class="dashboard-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <p class="page-subtitle">家庭资产概览</p>
    </div>

    <template v-if="hasAssets">
      <!-- 核心指标卡片 -->
      <NGrid :x-gap="16" :y-gap="16" :cols="4" class="stats-grid">
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="总资产">
              <template #prefix>{{ currencySymbol }}</template>
              <span class="stat-value">{{ formatAmount(stats.totalAssets) }}</span>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="总负债">
              <template #prefix>{{ currencySymbol }}</template>
              <span class="stat-value">{{ formatAmount(stats.totalLiabilities) }}</span>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card stat-card--primary">
            <NStatistic label="净资产">
              <template #prefix>{{ currencySymbol }}</template>
              <span class="stat-value">{{ formatAmount(stats.netWorth) }}</span>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="负债率">
              <span class="stat-value">{{ formatInteger(stats.liabilityRatio) }}</span>
              <template #suffix>%</template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 资产分布与构成 -->
      <NGrid :x-gap="16" :y-gap="16" :cols="2" class="charts-grid">
        <NGridItem>
          <NCard title="资产分布" class="chart-card">
            <AssetDistributionChart :data="distribution" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="资产构成" class="chart-card">
            <NSpace vertical :size="12">
              <div class="asset-row">
                <span class="asset-row-label">🏠 固定资产</span>
                <strong class="asset-row-value">{{ currencySymbol }}{{ formatAmount(stats.fixedAssets) }}</strong>
              </div>
              <div class="asset-row">
                <span class="asset-row-label">💰 流动资产</span>
                <strong class="asset-row-value">{{ currencySymbol }}{{ formatAmount(stats.liquidAssets) }}</strong>
              </div>
              <div class="asset-row">
                <span class="asset-row-label">📈 投资资产</span>
                <strong class="asset-row-value">{{ currencySymbol }}{{ formatAmount(stats.investmentAssets) }}</strong>
              </div>
            </NSpace>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 快速操作 -->
      <NCard title="快速操作" class="action-card">
        <NSpace>
          <NButton type="primary" @click="$router.push('/assets')">添加资产</NButton>
          <NButton type="primary" @click="$router.push('/transactions')">记一笔</NButton>
          <NButton @click="$router.push('/reports')">查看报表</NButton>
        </NSpace>
      </NCard>
    </template>

    <NCard v-else class="empty-card">
      <NEmpty description="还没有资产数据，开始添加吧">
        <template #extra>
          <NButton type="primary" @click="$router.push('/assets')">
            添加第一笔资产
          </NButton>
        </template>
      </NEmpty>
    </NCard>
  </div>
</template>

<style scoped>
.dashboard-view {
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color-1);
}

.page-subtitle {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 14px;
}

/* 统计卡片网格 */
.stats-grid {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-card--primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid var(--color-primary-light);
}

.stat-value {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

/* 图表网格 */
.charts-grid {
  margin-bottom: 24px;
}

.chart-card {
  height: 100%;
}

.asset-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
}

.asset-row:last-child {
  border-bottom: none;
}

.asset-row-label {
  font-size: 14px;
  color: var(--n-text-color-2);
}

.asset-row-value {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

/* 操作卡片 */
.action-card {
  margin-bottom: 24px;
}

/* 空状态卡片 */
.empty-card {
  text-align: center;
}
</style>
