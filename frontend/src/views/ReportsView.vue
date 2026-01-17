<script setup lang="ts">
import { computed, ref, onMounted, h } from 'vue'
import {
  NCard, NSpace, NStatistic, NEmpty, NSelect,
  NGrid, NGridItem, NDataTable, type DataTableColumns
} from 'naive-ui'
import { useTransactionStore } from '@/stores/transactions'
import { useAssetStore } from '@/stores/assets'
import { useMemberStore } from '@/stores/members'
import { Line, Bar, Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js'
import dayjs from 'dayjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement)

const transactionStore = useTransactionStore()
const assetStore = useAssetStore()
const memberStore = useMemberStore()

// 筛选条件
const selectedYear = ref(dayjs().year())
const selectedMonth = ref(dayjs().month() + 1)

// 年份选项
const yearOptions = [
  { label: String(dayjs().year()), value: dayjs().year() },
  { label: String(dayjs().year() - 1), value: dayjs().year() - 1 },
  { label: String(dayjs().year() - 2), value: dayjs().year() - 2 }
]

// 月份选项
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}月`,
  value: i + 1
}))

// 按月统计收支
const monthlyStats = computed(() => {
  const stats: Record<string, { income: number; expense: number; net: number }> = {}

  for (let m = 1; m <= 12; m++) {
    const key = `${selectedYear.value}-${m.toString().padStart(2, '0')}`
    stats[key] = { income: 0, expense: 0, net: 0 }
  }

  for (const t of transactionStore.transactions) {
    const date = dayjs(t.date)
    if (date.year() === selectedYear.value) {
      const key = date.format('YYYY-MM')
      if (!stats[key]) {
        stats[key] = { income: 0, expense: 0, net: 0 }
      }
      if (t.type === 'income') {
        stats[key].income += t.amount
      } else if (t.type === 'expense') {
        stats[key].expense += t.amount
      }
      stats[key].net = stats[key].income - stats[key].expense
    }
  }

  return Object.entries(stats)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
})

// 收支趋势图数据
const trendChartData = computed(() => ({
  labels: monthlyStats.value.map(m => m.month.slice(5)),
  datasets: [
    {
      label: '收入',
      data: monthlyStats.value.map(m => m.income),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3
    },
    {
      label: '支出',
      data: monthlyStats.value.map(m => m.expense),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.3
    },
    {
      label: '净收入',
      data: monthlyStats.value.map(m => m.net),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3
    }
  ]
}))

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || ''
          const value = context.raw || 0
          return `${label}: ¥${Number(value).toLocaleString()}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `¥${value}`
      }
    }
  }
}

// 收支分类占比数据
const expensePieData = computed(() => {
  const entries = Object.entries(transactionStore.expenseByCategory)
  return {
    labels: entries.map(([, data]) => data.name),
    datasets: [{
      data: entries.map(([, data]) => data.amount),
      backgroundColor: entries.map(([, data]) => data.color)
    }]
  }
})

const incomePieData = computed(() => {
  const entries = Object.entries(transactionStore.incomeByCategory)
  return {
    labels: entries.map(([, data]) => data.name),
    datasets: [{
      data: entries.map(([, data]) => data.amount),
      backgroundColor: entries.map(([, data]) => data.color)
    }]
  }
})

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const value = context.raw || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `¥${value.toLocaleString()} (${percentage}%)`
        }
      }
    }
  }
}

// 成员资产对比
const memberAssetComparison = computed(() => {
  const comparison: Record<string, { name: string; totalAssets: number; color: string; count: number }> = {}

  for (const asset of assetStore.activeAssets) {
    const member = memberStore.getMemberById(asset.holderId)
    if (member) {
      const memberId = member.id
      if (!comparison[memberId]) {
        comparison[memberId] = {
          name: member.name,
          totalAssets: 0,
          color: member.color,
          count: 0
        }
      }
      const amountInBase = asset.currentValue * (asset.currency === 'CNY' ? 1 : 1)
      comparison[memberId].totalAssets += amountInBase
      comparison[memberId].count++
    }
  }

  return Object.values(comparison).sort((a, b) => b.totalAssets - a.totalAssets)
})

// 成员资产对比图数据
const memberComparisonData = computed(() => ({
  labels: memberAssetComparison.value.map(m => m.name),
  datasets: [{
    label: '资产总额',
    data: memberAssetComparison.value.map(m => m.totalAssets),
    backgroundColor: memberAssetComparison.value.map(m => m.color),
    borderRadius: 8
  }]
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `¥${Number(context.raw).toLocaleString()}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `¥${value}`
      }
    }
  }
}

// 按成员的交易统计表格
const memberTransactionColumns: DataTableColumns<{
  name: string
  income: number
  expense: number
  net: number
  transactionCount: number
}> = [
  {
    title: '成员',
    key: 'name',
    render: (row) => h('span', {
      style: {
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: memberAssetComparison.value.find(m => m.name === row.name)?.color || '#999',
        marginRight: '8px'
      }
    }, row.name)
  },
  {
    title: '收入',
    key: 'income',
    render: (row) => h('span', { class: 'amount amount--income' }, `¥${row.income.toLocaleString()}`)
  },
  {
    title: '支出',
    key: 'expense',
    render: (row) => h('span', { class: 'amount amount--expense' }, `¥${row.expense.toLocaleString()}`)
  },
  {
    title: '净收入',
    key: 'net',
    render: (row) => h('span', {
      class: row.net >= 0 ? 'amount amount--income' : 'amount amount--expense'
    }, `${row.net >= 0 ? '+' : ''}¥${row.net.toLocaleString()}`)
  },
  {
    title: '交易笔数',
    key: 'transactionCount'
  }
]

const memberTransactionData = computed(() => {
  const stats: Record<string, { name: string; income: number; expense: number; net: number; transactionCount: number; color: string }> = {}

  for (const member of memberStore.members) {
    stats[member.id] = {
      name: member.name,
      income: 0,
      expense: 0,
      net: 0,
      transactionCount: 0,
      color: member.color
    }
  }

  for (const t of transactionStore.transactions) {
    const member = memberStore.getMemberById(t.memberId)
    if (member && stats[member.id]) {
      const memberId = member.id
      if (t.type === 'income') {
        stats[memberId]!.income += t.amount
      } else if (t.type === 'expense') {
        stats[memberId]!.expense += t.amount
      }
      stats[memberId]!.transactionCount++
    }
  }

  for (const stat of Object.values(stats)) {
    stat.net = stat.income - stat.expense
  }

  return Object.values(stats).filter(s => s.transactionCount > 0)
})

// 储蓄率
const savingsRate = computed(() => {
  const totalIncome = transactionStore.totalIncome
  if (totalIncome === 0) return 0
  return (transactionStore.netIncome / totalIncome) * 100
})

// 总体统计
const totalStats = computed(() => ({
  totalIncome: transactionStore.totalIncome,
  totalExpense: transactionStore.totalExpense,
  netIncome: transactionStore.netIncome,
  avgMonthlyIncome: monthlyStats.value.reduce((sum, m) => sum + m.income, 0) / 12,
  avgMonthlyExpense: monthlyStats.value.reduce((sum, m) => sum + m.expense, 0) / 12
}))

const hasData = computed(() => transactionStore.transactions.length > 0 || assetStore.assets.length > 0)

onMounted(async () => {
  await memberStore.loadMembers()
})
</script>

<template>
  <div class="reports-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">报表分析</h2>
      <p class="page-subtitle">收支趋势与资产分析</p>
    </div>

    <!-- 空状态 -->
    <NEmpty v-if="!hasData" description="暂无数据，请先添加资产或记录收支" class="empty-state" />

    <NSpace v-else vertical :size="24">
      <!-- 筛选控制栏 -->
      <NCard class="filter-card">
        <NSpace :size="16" align="center">
          <span class="filter-label">统计年份：</span>
          <NSelect
            v-model:value="selectedYear"
            :options="yearOptions"
            style="width: 120px"
          />
          <span class="filter-label">统计月份：</span>
          <NSelect
            v-model:value="selectedMonth"
            :options="monthOptions"
            style="width: 100px"
          />
        </NSpace>
      </NCard>

      <!-- 收支趋势图 -->
      <NCard title="收支趋势分析" class="chart-card">
        <template #header-extra>
          <span class="chart-unit">单位: 元</span>
        </template>
        <div class="chart-container chart-container--line">
          <Line :data="trendChartData" :options="trendChartOptions" />
        </div>
      </NCard>

      <!-- 核心指标 -->
      <NGrid :x-gap="16" :y-gap="16" :cols="4" class="stats-grid">
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="年度总收入" :value="totalStats.totalIncome">
              <template #prefix>¥</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="年度总支出" :value="totalStats.totalExpense">
              <template #prefix>¥</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card stat-card--primary">
            <NStatistic label="年度净收入" :value="totalStats.netIncome">
              <template #prefix>¥</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic label="储蓄率" :value="savingsRate" :precision="1">
              <template #suffix>%</template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 收支分类占比 -->
      <NGrid :x-gap="16" :y-gap="16" :cols="2">
        <NGridItem>
          <NCard title="支出分类占比" class="chart-card">
            <div class="chart-container chart-container--pie">
              <Pie v-if="Object.keys(transactionStore.expenseByCategory).length > 0"
                :data="expensePieData"
                :options="pieChartOptions"
              />
              <NEmpty v-else description="暂无支出数据" size="small" />
            </div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="收入分类占比" class="chart-card">
            <div class="chart-container chart-container--pie">
              <Pie v-if="Object.keys(transactionStore.incomeByCategory).length > 0"
                :data="incomePieData"
                :options="pieChartOptions"
              />
              <NEmpty v-else description="暂无收入数据" size="small" />
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 成员资产对比 -->
      <NCard title="成员资产对比" class="chart-card">
        <div class="chart-container chart-container--bar">
          <Bar v-if="memberAssetComparison.length > 0"
            :data="memberComparisonData"
            :options="barChartOptions"
          />
          <NEmpty v-else description="暂无成员数据" size="small" />
        </div>
      </NCard>

      <!-- 成员交易统计表 -->
      <NCard title="成员收支统计" class="table-card">
        <NDataTable
          :columns="memberTransactionColumns"
          :data="memberTransactionData"
          :pagination="false"
          :bordered="false"
        />
      </NCard>

      <!-- 月度数据详情 -->
      <NCard title="月度收支明细" class="table-card">
        <NDataTable
          :columns="[
            { title: '月份', key: 'month', render: (row) => row.month.slice(5) + '月' },
            {
              title: '收入',
              key: 'income',
              render: (row) => h('span', { class: 'amount amount--income' }, `¥${row.income.toLocaleString()}`)
            },
            {
              title: '支出',
              key: 'expense',
              render: (row) => h('span', { class: 'amount amount--expense' }, `¥${row.expense.toLocaleString()}`)
            },
            {
              title: '净收入',
              key: 'net',
              render: (row) => h('span', {
                class: row.net >= 0 ? 'amount amount--income' : 'amount amount--expense'
              }, `${row.net >= 0 ? '+' : ''}¥${row.net.toLocaleString()}`)
            }
          ]"
          :data="monthlyStats.filter(m => m.income > 0 || m.expense > 0)"
          :pagination="false"
          :bordered="false"
        />
      </NCard>
    </NSpace>
  </div>
</template>

<style scoped>
.reports-view {
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

/* 空状态 */
.empty-state {
  margin-top: 60px;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px;
}

.filter-label {
  font-size: 14px;
  color: var(--n-text-color-2);
}

/* 图表卡片 */
.chart-card {
  margin-bottom: 24px;
}

.chart-unit {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.chart-container {
  position: relative;
}

.chart-container--line {
  height: 320px;
}

.chart-container--pie {
  height: 280px;
}

.chart-container--bar {
  height: 280px;
}

/* 统计网格 */
.stats-grid {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-card--primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 表格卡片 */
.table-card {
  margin-bottom: 24px;
}

/* 金额样式 */
.amount {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.amount--income {
  color: var(--color-success);
}

.amount--expense {
  color: var(--color-error);
}
</style>
