<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NSpace, NStatistic, NDescriptions, NDescriptionsItem, NEmpty, NSpin, NTag, NDivider, NGrid, NGridItem } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import type { Asset } from '@/types'
import { formatAssetValue, currencySymbols, convertCurrency, formatCurrency } from '@/utils/currency'
import dayjs from 'dayjs'

// 基准货币
const BASE_CURRENCY = 'CNY'

const route = useRoute()
const router = useRouter()
const assetStore = useAssetStore()

const asset = computed(() => {
  return assetStore.assets.find(a => a.id === route.params.id)
})

const category = computed(() => {
  return asset.value ? assetStore.getCategoryById(asset.value.categoryId) : null
})

onMounted(async () => {
  if (route.params.id) {
    await assetStore.loadChanges(route.params.id as string)
  }
})

async function handleDelete() {
  if (asset.value) {
    await assetStore.deleteAsset(asset.value.id)
    router.push('/assets')
  }
}

function handleEdit() {
  if (asset.value) {
    router.push(`/assets`)
    // TODO: 打开编辑弹窗
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
              <NButton @click="handleEdit">编辑</NButton>
              <NButton type="error" @click="handleDelete">删除</NButton>
            </NSpace>
          </template>

          <NSpace vertical :size="24">
            <!-- 核心数据 -->
            <NGrid :x-gap="16" :cols="3">
              <NGridItem>
                <NStatistic label="当前估值">
                  <div style="display: flex; flex-direction: column">
                    <span style="font-weight: bold">{{ formatAssetAmount(asset.currentValue, asset.currency).original }}</span>
                    <span v-if="formatAssetAmount(asset.currentValue, asset.currency).converted" style="font-size: 12px; color: #999">
                      {{ formatAssetAmount(asset.currentValue, asset.currency).converted }}
                    </span>
                  </div>
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="初始金额">
                  <div style="display: flex; flex-direction: column">
                    <span style="font-weight: bold">{{ formatAssetAmount(asset.initialValue, asset.currency).original }}</span>
                    <span v-if="formatAssetAmount(asset.initialValue, asset.currency).converted" style="font-size: 12px; color: #999">
                      {{ formatAssetAmount(asset.initialValue, asset.currency).converted }}
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
              <NDescriptionsItem label="购买日期">
                {{ dayjs(asset.purchaseDate).format('YYYY年MM月DD日') }}
              </NDescriptionsItem>
              <NDescriptionsItem label="币种">
                {{ currencySymbols[asset.currency] || asset.currency }}
              </NDescriptionsItem>
              <NDescriptionsItem label="状态">
                {{ asset.status === 'active' ? '持有中' : '已处置' }}
              </NDescriptionsItem>
              <NDescriptionsItem v-if="asset.notes" label="备注" :span="2">
                {{ asset.notes }}
              </NDescriptionsItem>
            </NDescriptions>

            <!-- 变动记录 -->
            <div v-if="assetStore.changes.length > 0">
              <h3>变动记录</h3>
              <NSpace vertical :size="8">
                <div
                  v-for="change in assetStore.changes"
                  :key="change.id"
                  class="change-item"
                >
                  <div class="change-header">
                    <span class="change-type">{{ change.type }}</span>
                    <span class="change-date">{{ dayjs(change.date).format('YYYY-MM-DD') }}</span>
                  </div>
                  <div class="change-detail">
                    {{ formatCurrency(change.beforeValue, asset.currency, true) }} → {{ formatCurrency(change.afterValue, asset.currency, true) }}
                  </div>
                  <div v-if="change.notes" class="change-notes">
                    {{ change.notes }}
                  </div>
                </div>
              </NSpace>
            </div>
          </NSpace>
        </NCard>
      </template>

      <NEmpty v-else description="资产不存在" />
    </NSpin>
  </div>
</template>

<style scoped>
.asset-detail-view {
  max-width: 1000px;
  margin: 0 auto;
}

.change-item {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.change-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.change-type {
  font-weight: 500;
  color: #666;
}

.change-date {
  font-size: 12px;
  color: #999;
}

.change-detail {
  color: #333;
}

.change-notes {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>
