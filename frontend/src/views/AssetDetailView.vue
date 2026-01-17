<script setup lang="ts">
import { computed, onMounted, ref, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard, NButton, NSpace, NStatistic, NDescriptions, NDescriptionsItem, NEmpty, NSpin,
  NTag, NDivider, NGrid, NGridItem, NModal, NInputNumber, NSelect, NDatePicker, NDataTable,
  NAlert, NFormItem, NForm
} from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import { useMemberStore } from '@/stores/members'
import type { AssetChange } from '@/types'
import { formatAssetValue, currencySymbols, formatCurrency } from '@/utils/currency'
import dayjs from 'dayjs'
import { type DataTableColumns } from 'naive-ui'
import { Chart, registerables } from 'chart.js'

// 基准货币
const BASE_CURRENCY = 'CNY'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const assetStore = useAssetStore()
const memberStore = useMemberStore()

// 状态
const showChangeModal = ref(false)
const changeType = ref<'buy' | 'sell' | 'valuation_adjust' | 'transfer' | 'dispose'>('buy')
const changeAmount = ref<number | null>(null)
const changeDate = ref<number>(dayjs().valueOf())
const changeNotes = ref('')
const changeStatus = ref<'idle' | 'loading'>('idle')
const transferTargetMember = ref<string | null>(null)

const chartCanvas = ref<HTMLCanvasElement>()
const chartInstance = ref<Chart>()

const asset = computed(() => {
  return assetStore.assets.find(a => a.id === route.params.id as string)
})

const category = computed(() => {
  return asset.value ? assetStore.getCategoryById(asset.value.categoryId) : null
})

const member = computed(() => {
  return asset.value ? memberStore.getMemberById(asset.value.holderId) : null
})

// 盈亏统计
const profitLossStats = computed(() => {
  const changes = assetStore.changes
  let totalProfit = 0
  let totalLoss = 0

  for (const change of changes) {
    if (change.profitLoss) {
      if (change.profitLoss > 0) {
        totalProfit += change.profitLoss
      } else {
        totalLoss += Math.abs(change.profitLoss)
      }
    }
  }

  return {
    totalProfit,
    totalLoss,
    netProfitLoss: totalProfit - totalLoss
  }
})

// 变动记录表格列
const changeColumns: DataTableColumns<AssetChange> = [
  {
    title: '日期',
    key: 'date',
    width: 120,
    render: (row) => dayjs(row.date).format('YYYY-MM-DD')
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row) => {
      const typeConfig: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
        buy: { label: '买入', type: 'success' },
        sell: { label: '卖出', type: 'warning' },
        transfer_in: { label: '转入', type: 'info' },
        transfer_out: { label: '转出', type: 'info' },
        valuation_adjust: { label: '估值调整', type: 'default' },
        depreciation: { label: '折旧', type: 'error' },
        dispose: { label: '处置', type: 'error' }
      }
      const config = typeConfig[row.type] || { label: row.type, type: 'default' }
      return h(NTag, { size: 'small', type: config.type }, { default: () => config.label })
    }
  },
  {
    title: '变动前',
    key: 'beforeValue',
    width: 120,
    render: (row) => formatCurrency(row.beforeValue, asset.value?.currency || BASE_CURRENCY, true)
  },
  {
    title: '变动后',
    key: 'afterValue',
    width: 120,
    render: (row) => formatCurrency(row.afterValue, asset.value?.currency || BASE_CURRENCY, true)
  },
  {
    title: '变动金额',
    key: 'amount',
    width: 120,
    render: (row) => {
      const amount = row.amount
      const isPositive = amount >= 0
      return h('span', {
        style: { color: isPositive ? '#10B981' : '#EF4444' }
      }, `${isPositive ? '+' : ''}${formatCurrency(amount, asset.value?.currency || BASE_CURRENCY, true)}`)
    }
  },
  {
    title: '盈亏',
    key: 'profitLoss',
    width: 120,
    render: (row) => {
      if (row.profitLoss === undefined) return '-'
      const isPositive = row.profitLoss >= 0
      return h('span', {
        style: { color: isPositive ? '#10B981' : '#EF4444' }
      }, `${isPositive ? '+' : ''}${formatCurrency(row.profitLoss, asset.value?.currency || BASE_CURRENCY, true)} (${row.profitLossRate?.toFixed(2)}%)`)
    }
  },
  {
    title: '备注',
    key: 'notes',
    ellipsis: { tooltip: true }
  }
]

onMounted(async () => {
  if (route.params.id) {
    await assetStore.loadChanges(route.params.id as string)
    await memberStore.loadMembers()
    initChart()
  }
})

watch(() => assetStore.changes, () => {
  updateChart()
}, { deep: true })

function initChart() {
  if (!chartCanvas.value || !asset.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // 准备数据：包含初始值作为起点
  const dataPoints = [
    {
      date: asset.value.purchaseDate,
      value: asset.value.initialValue
    },
    ...assetStore.changes.map(c => ({
      date: c.date,
      value: c.afterValue
    }))
  ].sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1)

  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(d => dayjs(d.date).format('YYYY-MM-DD')),
      datasets: [{
        label: '资产价值',
        data: dataPoints.map(d => d.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return formatCurrency(context.raw as number, asset.value?.currency || BASE_CURRENCY, true)
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value as number, asset.value?.currency || BASE_CURRENCY, true)
          }
        }
      }
    }
  })
}

function updateChart() {
  if (!chartInstance.value || !asset.value) return

  const dataPoints = [
    {
      date: asset.value.purchaseDate,
      value: asset.value.initialValue
    },
    ...assetStore.changes.map(c => ({
      date: c.date,
      value: c.afterValue
    }))
  ].sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1)

  const chart = chartInstance.value
  if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
    chart.data.labels = dataPoints.map(d => dayjs(d.date).format('YYYY-MM-DD'))
    chart.data.datasets[0].data = dataPoints.map(d => d.value)
    chart.update()
  }
}

async function handleDelete() {
  if (asset.value && confirm('确定要删除这个资产吗？')) {
    await assetStore.deleteAsset(asset.value.id)
    router.push('/assets')
  }
}

function handleEdit() {
  if (asset.value) {
    // TODO: 打开编辑弹窗
  }
}

// 打开记录变动弹窗
function openChangeModal(type: 'buy' | 'sell' | 'valuation_adjust' | 'transfer' | 'dispose') {
  changeType.value = type
  changeAmount.value = null
  changeDate.value = dayjs().valueOf()
  changeNotes.value = ''
  transferTargetMember.value = null
  showChangeModal.value = true
}

// 提交变动记录
async function handleSubmitChange() {
  if (!asset.value || changeAmount.value === null) return

  changeStatus.value = 'loading'

  try {
    const date = dayjs(changeDate.value).format('YYYY-MM-DD')

    switch (changeType.value) {
      case 'buy':
        await assetStore.recordBuy(asset.value.id, changeAmount.value, date, changeNotes.value || undefined)
        break
      case 'sell':
        await assetStore.recordSell(asset.value.id, changeAmount.value, date, changeNotes.value || undefined)
        break
      case 'valuation_adjust':
        await assetStore.recordValueChange(asset.value.id, changeAmount.value, 'valuation_adjust', changeNotes.value || undefined)
        break
      case 'transfer':
        if (transferTargetMember.value) {
          await assetStore.recordTransferIn(asset.value.id, changeAmount.value, transferTargetMember.value, date, changeNotes.value || undefined)
        }
        break
      case 'dispose':
        await assetStore.recordDispose(asset.value.id, changeAmount.value, date, changeNotes.value || undefined)
        break
    }

    showChangeModal.value = false
    await assetStore.loadChanges(asset.value.id)
  } catch (error) {
    console.error('记录变动失败:', error)
    alert(`操作失败: ${error}`)
  } finally {
    changeStatus.value = 'idle'
  }
}

// 格式化显示金额（包含币种符号和转换）
function formatAssetAmount(amount: number, currency: string) {
  const value = formatAssetValue(amount, currency, BASE_CURRENCY)
  return value
}
</script>

<template>
  <div class="asset-detail-view">
    <NSpin :show="assetStore.loading">
      <template v-if="asset">
        <!-- 操作按钮 -->
        <NSpace justify="end" :size="12" style="margin-bottom: 16px;">
          <NButton @click="openChangeModal('buy')" type="success" size="small">
            + 买入
          </NButton>
          <NButton @click="openChangeModal('sell')" type="warning" size="small">
            - 卖出
          </NButton>
          <NButton @click="openChangeModal('valuation_adjust')" size="small">
            调整估值
          </NButton>
          <NButton @click="openChangeModal('transfer')" size="small">
            转账
          </NButton>
          <NButton @click="openChangeModal('dispose')" type="error" size="small">
            处置
          </NButton>
        </NSpace>

        <!-- 核心信息卡片 -->
        <NCard>
          <template #header>
            <NSpace align="center">
              <span>{{ category?.icon }} {{ asset.name }}</span>
              <NTag size="small" :type="asset.status === 'active' ? 'success' : 'default'">
                {{ asset.status === 'active' ? '持有中' : '已处置' }}
              </NTag>
            </NSpace>
          </template>
          <template #header-extra>
            <NSpace>
              <NButton @click="handleEdit" size="small">编辑</NButton>
              <NButton type="error" @click="handleDelete" size="small">删除</NButton>
            </NSpace>
          </template>

          <NSpace vertical :size="24">
            <!-- 核心数据 -->
            <NGrid :x-gap="16" :cols="4">
              <NGridItem>
                <NStatistic label="当前估值">
                  <div style="display: flex; flex-direction: column">
                    <span style="font-weight: bold; font-size: 18px;">
                      {{ formatAssetAmount(asset.currentValue, asset.currency).original }}
                    </span>
                    <span v-if="formatAssetAmount(asset.currentValue, asset.currency).converted" style="font-size: 12px; color: #999">
                      {{ formatAssetAmount(asset.currentValue, asset.currency).converted }}
                    </span>
                  </div>
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="初始金额">
                  <div style="display: flex; flex-direction: column">
                    <span style="font-weight: bold; font-size: 18px;">
                      {{ formatAssetAmount(asset.initialValue, asset.currency).original }}
                    </span>
                    <span v-if="formatAssetAmount(asset.initialValue, asset.currency).converted" style="font-size: 12px; color: #999">
                      {{ formatAssetAmount(asset.initialValue, asset.currency).converted }}
                    </span>
                  </div>
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="累计盈亏">
                  <div style="display: flex; flex-direction: column">
                    <span
                      :style="{
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: profitLossStats.netProfitLoss >= 0 ? '#10B981' : '#EF4444'
                      }"
                    >
                      {{ profitLossStats.netProfitLoss >= 0 ? '+' : '' }}
                      {{ formatCurrency(profitLossStats.netProfitLoss, asset.currency, true) }}
                    </span>
                    <span style="font-size: 12px; color: #999">
                      收益 {{ formatCurrency(profitLossStats.totalProfit, asset.currency, true) }}
                      / 亏损 {{ formatCurrency(profitLossStats.totalLoss, asset.currency, true) }}
                    </span>
                  </div>
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="持有天数" :value="Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))">
                  <template #suffix>天</template>
                </NStatistic>
              </NGridItem>
            </NGrid>

            <NDivider />

            <!-- 详细信息 -->
            <NDescriptions label-placement="left" :column="2">
              <NDescriptionsItem label="资产分类">
                {{ category?.icon }} {{ category?.name }}
              </NDescriptionsItem>
              <NDescriptionsItem label="所属成员">
                <span
                  :style="{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: member?.color,
                    marginRight: '6px'
                  }"
                ></span>
                {{ member?.name }}
              </NDescriptionsItem>
              <NDescriptionsItem label="购买日期">
                {{ dayjs(asset.purchaseDate).format('YYYY年MM月DD日') }}
              </NDescriptionsItem>
              <NDescriptionsItem label="币种">
                {{ currencySymbols[asset.currency] || asset.currency }}
              </NDescriptionsItem>
              <NDescriptionsItem v-if="asset.notes" label="备注" :span="2">
                {{ asset.notes }}
              </NDescriptionsItem>
            </NDescriptions>
          </NSpace>
        </NCard>

        <!-- 价值趋势图 -->
        <NCard title="价值趋势" style="margin-top: 16px;">
          <div style="height: 250px;">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </NCard>

        <!-- 变动记录表格 -->
        <NCard title="变动记录" style="margin-top: 16px;">
          <NDataTable
            :columns="changeColumns"
            :data="assetStore.changes"
            :pagination="{
              pageSize: 10
            }"
            :bordered="false"
          />
        </NCard>
      </template>

      <NEmpty v-else description="资产不存在" />
    </NSpin>

    <!-- 记录变动弹窗 -->
    <NModal
      v-model:show="showChangeModal"
      preset="card"
      :title="{
        buy: '记录买入',
        sell: '记录卖出',
        valuation_adjust: '调整估值',
        transfer: '资产转账',
        dispose: '资产处置'
      }[changeType]"
      style="width: 450px;"
    >
      <NForm label-placement="left" label-width="80">
        <!-- 变动类型说明 -->
        <NAlert v-if="changeType === 'valuation_adjust'" type="info" style="margin-bottom: 16px;">
          输入调整后的新价值，系统将自动计算盈亏
        </NAlert>
        <NAlert v-else-if="changeType === 'dispose'" type="warning" style="margin-bottom: 16px;">
          处置后资产价值将归零，状态变更为"已处置"
        </NAlert>

        <!-- 金额输入 -->
        <NFormItem :label="{
          buy: '买入金额',
          sell: '卖出金额',
          valuation_adjust: '新价值',
          transfer: '转账金额',
          dispose: '处置价值'
        }[changeType]">
          <NInputNumber
            v-model:value="changeAmount"
            :min="0"
            :precision="2"
            style="width: 100%;"
            :placeholder="asset ? `当前: ${formatCurrency(asset.currentValue, asset.currency, true)}` : ''"
          >
            <template #suffix>
              {{ asset?.currency }}
            </template>
          </NInputNumber>
        </NFormItem>

        <!-- 转账目标成员 -->
        <NFormItem v-if="changeType === 'transfer'" label="目标成员">
          <NSelect
            v-model:value="transferTargetMember"
            :options="memberStore.members.filter(m => m.id !== asset?.holderId).map(m => ({
              label: m.name,
              value: m.id
            }))"
            placeholder="选择转入的成员"
          />
        </NFormItem>

        <!-- 日期 -->
        <NFormItem label="日期">
          <NDatePicker
            v-model:value="changeDate"
            type="date"
            style="width: 100%;"
          />
        </NFormItem>

        <!-- 备注 -->
        <NFormItem label="备注">
          <NInput
            v-model:value="changeNotes"
            type="textarea"
            placeholder="可选填写备注信息"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showChangeModal = false" :disabled="changeStatus === 'loading'">
            取消
          </NButton>
          <NButton type="primary" @click="handleSubmitChange" :disabled="changeStatus === 'loading' || changeAmount === null">
            确认
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.asset-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
</style>
