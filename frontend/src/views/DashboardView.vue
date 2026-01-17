<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NSpace, NButton, NEmpty } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import AssetDistributionChart from '@/components/AssetDistributionChart.vue'

const assetStore = useAssetStore()

const stats = computed(() => assetStore.statistics)
const distribution = computed(() => assetStore.distribution)
const hasAssets = computed(() => assetStore.activeAssets.length > 0)

// 基准货币
const BASE_CURRENCY = 'CNY'
const currencySymbol = computed(() => {
  const symbols: Record<string, string> = { CNY: '¥', USD: '$', HKD: 'HK$', GBP: '£', EUR: '€' }
  return symbols[BASE_CURRENCY] || BASE_CURRENCY
})

// 格式化金额显示（带千分位）
function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化整数显示（带千分位，用于负债率等）
function formatInteger(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
</script>

<template>
  <div class="dashboard">
    <NSpace vertical :size="24">
      <!-- 顶部标题 -->
      <div class="header">
        <h2>仪表盘</h2>
        <p>家庭资产概览</p>
      </div>

      <template v-if="hasAssets">
        <!-- 核心指标卡片 -->
        <NGrid :x-gap="16" :y-gap="16" :cols="4">
          <NGridItem>
            <NCard>
              <NStatistic label="总资产">
                <template #prefix>{{ currencySymbol }}</template>
                <span>{{ formatAmount(stats.totalAssets) }}</span>
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="总负债">
                <template #prefix>{{ currencySymbol }}</template>
                <span>{{ formatAmount(stats.totalLiabilities) }}</span>
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="净资产">
                <template #prefix>{{ currencySymbol }}</template>
                <span>{{ formatAmount(stats.netWorth) }}</span>
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="负债率">
                <span>{{ formatInteger(stats.liabilityRatio) }}</span>
                <template #suffix>%</template>
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <!-- 资产分布图表 -->
        <NGrid :x-gap="16" :y-gap="16" :cols="2">
          <NGridItem>
            <NCard title="资产分布">
              <AssetDistributionChart :data="distribution" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="资产构成">
              <NSpace vertical>
                <div class="asset-row">
                  <span>🏠 固定资产</span>
                  <strong>{{ currencySymbol }}{{ formatAmount(stats.fixedAssets) }}</strong>
                </div>
                <div class="asset-row">
                  <span>💰 流动资产</span>
                  <strong>{{ currencySymbol }}{{ formatAmount(stats.liquidAssets) }}</strong>
                </div>
                <div class="asset-row">
                  <span>📈 投资资产</span>
                  <strong>{{ currencySymbol }}{{ formatAmount(stats.investmentAssets) }}</strong>
                </div>
              </NSpace>
            </NCard>
          </NGridItem>
        </NGrid>

        <!-- 快速操作 -->
        <NCard title="快速操作">
          <NSpace>
            <NButton type="primary" @click="$router.push('/assets')">添加资产</NButton>
            <NButton type="primary" @click="$router.push('/transactions')">记一笔</NButton>
            <NButton @click="$router.push('/reports')">查看报表</NButton>
          </NSpace>
        </NCard>
      </template>

      <NCard v-else>
        <NEmpty description="还没有资产数据，开始添加吧">
          <template #extra>
            <NButton type="primary" @click="$router.push('/assets')">
              添加第一笔资产
            </NButton>
          </template>
        </NEmpty>
      </NCard>
    </NSpace>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header p {
  margin: 0;
  color: #999;
}

.asset-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.asset-row:last-child {
  border-bottom: none;
}
</style>
