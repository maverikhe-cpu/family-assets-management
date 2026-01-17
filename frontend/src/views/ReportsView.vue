<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NSpace, NStatistic, NNumberAnimation, NEmpty } from 'naive-ui'
import { useTransactionStore } from '@/stores/transactions'
import { useAssetStore } from '@/stores/assets'

const transactionStore = useTransactionStore()
const assetStore = useAssetStore()

// 支出按分类排序
const expenseCategories = computed(() => {
  return Object.entries(transactionStore.expenseByCategory)
    .map(([categoryId, data]) => ({ categoryId, ...data }))
    .sort((a, b) => b.amount - a.amount)
})

// 收入按分类排序
const incomeCategories = computed(() => {
  return Object.entries(transactionStore.incomeByCategory)
    .map(([categoryId, data]) => ({ categoryId, ...data }))
    .sort((a, b) => b.amount - a.amount)
})

// 储蓄率
const savingsRate = computed(() => {
  if (transactionStore.totalIncome === 0) return 0
  return (transactionStore.netIncome / transactionStore.totalIncome) * 100
})

const hasTransactions = computed(() => transactionStore.transactions.length > 0)
</script>

<template>
  <div class="reports-view">
    <NSpace vertical :size="24">
      <NCard title="收支统计">
        <NEmpty v-if="!hasTransactions" description="暂无数据，请先记录收支" />
        <template v-else>
          <NSpace :size="32">
            <NStatistic label="总收入" :value="transactionStore.totalIncome">
              <template #prefix>¥</template>
              <template #suffix>
                <NNumberAnimation :from="0" :to="transactionStore.totalIncome" />
              </template>
            </NStatistic>
            <NStatistic label="总支出" :value="transactionStore.totalExpense">
              <template #prefix>¥</template>
            </NStatistic>
            <NStatistic label="净收入" :value="transactionStore.netIncome">
              <template #prefix>¥</template>
            </NStatistic>
            <NStatistic label="储蓄率" :value="savingsRate">
              <template #suffix>%</template>
            </NStatistic>
          </NSpace>
        </template>
      </NCard>

      <NCard v-if="expenseCategories.length > 0" title="支出分类统计">
        <NSpace vertical :size="12">
          <div
            v-for="item in expenseCategories"
            :key="item.categoryId"
            class="category-row"
          >
            <div class="category-header">
              <span class="category-name">{{ item.icon }} {{ item.name }}</span>
              <span class="category-amount">¥{{ item.amount.toLocaleString() }}</span>
            </div>
            <div class="category-bar">
              <div
                class="category-bar-fill"
                :style="{
                  width: `${(item.amount / transactionStore.totalExpense) * 100}%`,
                  backgroundColor: item.color
                }"
              />
            </div>
            <div class="category-meta">
              <span>{{ item.count }} 笔</span>
              <span>{{ ((item.amount / transactionStore.totalExpense) * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </NSpace>
      </NCard>

      <NCard v-if="incomeCategories.length > 0" title="收入分类统计">
        <NSpace vertical :size="12">
          <div
            v-for="item in incomeCategories"
            :key="item.categoryId"
            class="category-row"
          >
            <div class="category-header">
              <span class="category-name">{{ item.icon }} {{ item.name }}</span>
              <span class="category-amount income">¥{{ item.amount.toLocaleString() }}</span>
            </div>
            <div class="category-bar">
              <div
                class="category-bar-fill"
                :style="{
                  width: `${(item.amount / transactionStore.totalIncome) * 100}%`,
                  backgroundColor: item.color
                }"
              />
            </div>
            <div class="category-meta">
              <span>{{ item.count }} 笔</span>
              <span>{{ ((item.amount / transactionStore.totalIncome) * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </NSpace>
      </NCard>

      <NCard title="资产健康度">
        <NSpace vertical :size="16">
          <div class="health-indicator">
            <div class="health-header">
              <span>净资产</span>
              <span class="health-value">¥{{ assetStore.statistics.netWorth.toLocaleString() }}</span>
            </div>
            <div class="health-desc">
              总资产 - 总负债 = 家庭净值
            </div>
          </div>
          <div class="health-indicator">
            <div class="health-header">
              <span>负债率</span>
              <span class="health-value" :class="{ warning: assetStore.statistics.liabilityRatio > 50 }">
                {{ assetStore.statistics.liabilityRatio.toFixed(1) }}%
              </span>
            </div>
            <div class="health-desc">
              <span v-if="assetStore.statistics.liabilityRatio < 30">健康</span>
              <span v-else-if="assetStore.statistics.liabilityRatio < 50" class="warning">预警</span>
              <span v-else class="danger">警戒</span>
              (建议保持在50%以下)
            </div>
          </div>
        </NSpace>
      </NCard>
    </NSpace>
  </div>
</template>

<style scoped>
.reports-view {
  max-width: 1200px;
  margin: 0 auto;
}

.category-row {
  padding: 12px 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-name {
  font-weight: 500;
}

.category-amount {
  font-weight: bold;
}

.category-amount.income {
  color: #10b981;
}

.category-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.category-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.health-indicator {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.health-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.health-value {
  font-weight: bold;
  color: #10b981;
}

.health-value.warning {
  color: #f59e0b;
}

.health-desc {
  font-size: 12px;
  color: #666;
}

.health-desc .warning {
  color: #f59e0b;
}

.health-desc .danger {
  color: #ef4444;
}
</style>
