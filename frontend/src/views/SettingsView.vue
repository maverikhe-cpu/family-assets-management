<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NSpace, NButton, NModal, NAlert, NSpin, NProgress } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import { useMemberStore } from '@/stores/members'
import * as db from '@/db'

const assetStore = useAssetStore()
const memberStore = useMemberStore()

const showExportModal = ref(false)
const showImportModal = ref(false)
const showClearModal = ref(false)
const exportData = ref('')
const importStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const importMessage = ref('')
const importProgress = ref(0)

async function handleExport() {
  const assets = await db.db.assets.toArray()
  const transactions = await db.db.transactions.toArray()
  const assetCategories = await db.db.assetCategories.toArray()
  const transactionCategories = await db.db.transactionCategories.toArray()

  exportData.value = JSON.stringify({
    assets,
    transactions,
    assetCategories,
    transactionCategories,
    exportDate: new Date().toISOString()
  }, null, 2)

  showExportModal.value = true
}

function downloadExport() {
  const blob = new Blob([exportData.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `family-assets-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  showExportModal.value = false
}

async function handleImport() {
  importStatus.value = 'loading'
  importMessage.value = '正在导入数据...'
  importProgress.value = 0

  try {
    // 获取导入数据
    const response = await fetch('/import-data.json')
    const data = await response.json()

    importProgress.value = 30
    importMessage.value = `找到 ${data.length} 条资产记录`

    // 导入资产
    const count = await db.importAssets(data)

    importProgress.value = 80
    importMessage.value = `成功导入 ${count} 条资产`

    // 重新加载数据
    await assetStore.loadAssets()
    await memberStore.loadMembers()

    importProgress.value = 100
    importStatus.value = 'success'
    importMessage.value = `导入完成！成功导入 ${count} 条资产记录，${memberStore.members.length} 位成员`

    // 3秒后关闭弹窗
    setTimeout(() => {
      showImportModal.value = false
      importStatus.value = 'idle'
      importProgress.value = 0
    }, 3000)

  } catch (error) {
    importStatus.value = 'error'
    importMessage.value = `导入失败：${error}`
  }
}

async function handleClear() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    await db.db.assets.clear()
    await db.db.transactions.clear()
    await db.db.assetChanges.clear()
    await db.db.budgets.clear()
    // 不清除默认分类
    location.reload()
  }
}

async function handleResetCategories() {
  if (confirm('确定要重置分类吗？这将清除所有自定义分类')) {
    await db.db.assetCategories.clear()
    await db.db.transactionCategories.clear()
    await db.initDefaultAssetCategories()
    await db.initDefaultTransactionCategories()
    location.reload()
  }
}
</script>

<template>
  <div class="settings-view">
    <NSpace vertical :size="24">
      <NCard title="数据导入">
        <NSpace vertical :size="12">
          <p>从预置数据文件导入初始资产数据（包含33条资产记录）</p>
          <p style="color: #666; font-size: 12px;">包含资产：房产、股票基金、银行存款、保险等，支持多币种（CNY/USD/HKD/GBP）</p>
          <NButton type="primary" @click="showImportModal = true">导入初始数据</NButton>
        </NSpace>
      </NCard>

      <NCard title="数据导出">
        <NSpace vertical :size="12">
          <p>导出您的数据到本地，可用于备份或迁移</p>
          <NButton @click="handleExport">导出数据</NButton>
        </NSpace>
      </NCard>

      <NCard title="重置分类">
        <NSpace vertical :size="12">
          <p>将所有分类重置为默认模板，自定义分类将丢失</p>
          <NButton @click="handleResetCategories">重置为默认分类</NButton>
        </NSpace>
      </NCard>

      <NCard title="危险区域">
        <NAlert type="error" title="警告" style="margin-bottom: 12px">
          以下操作不可逆，请谨慎操作
        </NAlert>
        <NSpace vertical :size="12">
          <p>清空所有数据（资产、交易记录等），但保留默认分类</p>
          <NButton type="error" @click="handleClear">清空所有数据</NButton>
        </NSpace>
      </NCard>

      <NCard title="关于">
        <NSpace vertical>
          <p><strong>家庭资产管家</strong></p>
          <p>版本：1.0.0 (MVP)</p>
          <p>数据存储：本地 IndexedDB</p>
          <p>您的数据完全存储在本地浏览器中，不会上传到任何服务器</p>
        </NSpace>
      </NCard>
    </NSpace>

    <!-- 导入数据弹窗 -->
    <NModal
      v-model:show="showImportModal"
      preset="card"
      title="导入初始数据"
      style="width: 500px"
    >
      <NSpace vertical :size="16">
        <p>此操作将从预置文件导入资产数据，包含：</p>
        <ul>
          <li>固定资产（房产）：8处房产</li>
          <li>投资资产：股票基金、保险等</li>
          <li>流动资产：银行存款</li>
          <li>负债：房贷</li>
        </ul>

        <NAlert v-if="importStatus === 'success'" type="success">
          {{ importMessage }}
        </NAlert>
        <NAlert v-else-if="importStatus === 'error'" type="error">
          {{ importMessage }}
        </NAlert>
        <div v-else-if="importStatus === 'loading'">
          <NSpin :show="true">
            <div style="width: 300px;">
              <p>{{ importMessage }}</p>
              <NProgress :percentage="importProgress" :indicator-placement="'inside'" />
            </div>
          </NSpin>
        </div>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showImportModal = false" :disabled="importStatus === 'loading'">
            取消
          </NButton>
          <NButton type="primary" @click="handleImport" :disabled="importStatus === 'loading'">
            开始导入
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 导出数据弹窗 -->
    <NModal
      v-model:show="showExportModal"
      preset="card"
      title="导出数据"
      style="width: 600px"
    >
      <p style="margin-bottom: 12px;">复制下方内容保存，或直接下载</p>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow: auto; max-height: 300px;">{{ exportData }}</pre>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showExportModal = false">关闭</NButton>
          <NButton type="primary" @click="downloadExport">下载 JSON 文件</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}

ul {
  margin: 0;
  padding-left: 20px;
}

li {
  margin: 4px 0;
}
</style>
