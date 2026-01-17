<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NSpace, NButton, NModal, NAlert, NSpin, NProgress, NUpload, NUploadFileInfo, NInput } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import { useTransactionStore } from '@/stores/transactions'
import { useMemberStore } from '@/stores/members'
import {
  exportAssetsToExcel,
  exportTransactionsToExcel,
  exportAnnualReport,
  exportBackup,
  importBackup
} from '@/utils/export'
import * as db from '@/db'

const assetStore = useAssetStore()
const transactionStore = useTransactionStore()
const memberStore = useMemberStore()

const showImportModal = ref(false)
const showBackupModal = ref(false)
const importStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const importMessage = ref('')
const importProgress = ref(0)

// 备份文件上传
const fileList = ref<NUploadFileInfo[]>([])
const backupStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const backupMessage = ref('')

// 导出资产列表
function handleExportAssets() {
  exportAssetsToExcel(
    assetStore.assets,
    memberStore.getMemberName,
    (id: string) => assetStore.getCategoryById(id)?.name || '-'
  )
}

// 导出交易记录
function handleExportTransactions() {
  exportTransactionsToExcel(
    transactionStore.transactions,
    memberStore.getMemberName,
    (id: string) => transactionStore.getCategoryById(id)?.name || '-'
  )
}

// 导出年度报告
function handleExportAnnualReport() {
  exportAnnualReport({
    assets: assetStore.assets,
    transactions: transactionStore.transactions,
    statistics: assetStore.statistics,
    getMemberName: memberStore.getMemberName,
    getCategoryName: (id: string) => assetStore.getCategoryById(id)?.name || '-'
  })
}

// 导出完整备份
function handleExportBackup() {
  exportBackup({
    assets: assetStore.assets,
    transactions: transactionStore.transactions,
    categories: assetStore.categories,
    members: memberStore.members,
    statistics: assetStore.statistics
  })
}

// 处理备份文件选择
function handleBackupSelect(options: { fileList: NUploadFileInfo[] }) {
  fileList.value = options.fileList
}

// 处理备份恢复
async function handleRestoreBackup() {
  if (fileList.value.length === 0) {
    backupMessage.value = '请先选择备份文件'
    backupStatus.value = 'error'
    return
  }

  const file = fileList.value[0].file
  if (!file) return

  backupStatus.value = 'loading'
  backupMessage.value = '正在恢复数据...'

  try {
    const backup = await importBackup(file)

    // 清空现有数据
    await db.db.assets.clear()
    await db.db.transactions.clear()
    await db.db.assetCategories.clear()
    await db.db.transactionCategories.clear()

    // 恢复资产
    if (backup.data.assets?.length > 0) {
      await db.db.assets.bulkAdd(backup.data.assets)
    }

    // 恢复交易
    if (backup.data.transactions?.length > 0) {
      await db.db.transactions.bulkAdd(backup.data.transactions)
    }

    // 恢复分类
    if (backup.data.categories?.length > 0) {
      await db.db.assetCategories.bulkAdd(backup.data.categories)
    }

    // 恢复成员
    if (backup.data.members?.length > 0) {
      localStorage.setItem('family_members', JSON.stringify(backup.data.members))
    }

    // 重新加载数据
    await assetStore.loadCategories()
    await assetStore.loadAssets()
    await transactionStore.loadCategories()
    await transactionStore.loadTransactions()
    await memberStore.loadMembers()

    backupStatus.value = 'success'
    backupMessage.value = `恢复成功！共恢复 ${backup.data.assets?.length || 0} 项资产，${backup.data.transactions?.length || 0} 条交易`

    setTimeout(() => {
      showBackupModal.value = false
      fileList.value = []
      backupStatus.value = 'idle'
      location.reload()
    }, 2000)
  } catch (error) {
    backupStatus.value = 'error'
    backupMessage.value = `恢复失败：${error}`
  }
}

// 导入初始数据
async function handleImport() {
  importStatus.value = 'loading'
  importMessage.value = '正在导入数据...'
  importProgress.value = 0

  try {
    const response = await fetch('/import-data.json')
    const data = await response.json()

    importProgress.value = 30
    importMessage.value = `找到 ${data.length} 条资产记录`

    const count = await db.importAssets(data)

    importProgress.value = 80
    importMessage.value = `成功导入 ${count} 条资产`

    await assetStore.loadAssets()
    await memberStore.loadMembers()

    importProgress.value = 100
    importStatus.value = 'success'
    importMessage.value = `导入完成！成功导入 ${count} 条资产记录，${memberStore.members.length} 位成员`

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

// 清空数据
async function handleClear() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    await db.db.assets.clear()
    await db.db.transactions.clear()
    await db.db.assetChanges.clear()
    await db.db.budgets.clear()
    location.reload()
  }
}

// 重置分类
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
      <!-- Excel 导出 -->
      <NCard title="导出到 Excel">
        <NSpace vertical :size="12">
          <p class="section-desc">将数据导出为 Excel 文件，方便查看和分享</p>
          <NSpace :size="12">
            <NButton @click="handleExportAssets">
              📊 导出资产列表
            </NButton>
            <NButton @click="handleExportTransactions">
              📝 导出交易记录
            </NButton>
            <NButton @click="handleExportAnnualReport">
              📈 导出年度报告
            </NButton>
          </NSpace>
        </NSpace>
      </NCard>

      <!-- 数据备份与恢复 -->
      <NCard title="数据备份与恢复">
        <NSpace vertical :size="12">
          <p class="section-desc">创建完整数据备份或在需要时恢复数据</p>
          <NSpace :size="12">
            <NButton type="primary" @click="handleExportBackup">
              💾 创建备份文件
            </NButton>
            <NButton @click="showBackupModal = true">
              📂 从备份恢复
            </NButton>
          </NSpace>
        </NSpace>
      </NCard>

      <!-- 初始数据导入 -->
      <NCard title="导入初始数据">
        <NSpace vertical :size="12">
          <p>从预置数据文件导入初始资产数据（{{ assetStore.assets.length > 0 ? '已有数据，导入将追加' : '包含33条资产记录' }}）</p>
          <p style="color: #666; font-size: 12px;">包含资产：房产、股票基金、银行存款、保险等，支持多币种（CNY/USD/HKD/GBP）</p>
          <NButton type="primary" @click="showImportModal = true">导入初始数据</NButton>
        </NSpace>
      </NCard>

      <!-- 数据管理 -->
      <NCard title="数据管理">
        <NSpace vertical :size="12">
          <p>重置分类为默认模板</p>
          <NButton @click="handleResetCategories">重置分类</NButton>
        </NSpace>
      </NCard>

      <!-- 危险区域 -->
      <NCard title="危险区域">
        <NAlert type="error" title="警告" style="margin-bottom: 12px">
          以下操作不可逆，请谨慎操作
        </NAlert>
        <NSpace vertical :size="12">
          <p>清空所有数据（资产、交易记录等），但保留默认分类</p>
          <NButton type="error" @click="handleClear">清空所有数据</NButton>
        </NSpace>
      </NCard>

      <!-- 关于 -->
      <NCard title="关于">
        <NSpace vertical>
          <p><strong>家庭资产管家</strong></p>
          <p>版本：1.0.0 (MVP)</p>
          <p>数据存储：本地 IndexedDB</p>
          <p>您的数据完全存储在本地浏览器中，不会上传到任何服务器</p>
        </NSpace>
      </NCard>
    </NSpace>

    <!-- 导入初始数据弹窗 -->
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

    <!-- 备份恢复弹窗 -->
    <NModal
      v-model:show="showBackupModal"
      preset="card"
      title="从备份恢复数据"
      style="width: 500px"
    >
      <NSpace vertical :size="16">
        <p>选择之前创建的备份文件（.json）来恢复数据</p>
        <p style="color: #f56c6c; font-size: 12px;">⚠️ 恢复将覆盖现有所有数据，请谨慎操作</p>

        <NUpload
          :file-list="fileList"
          @update:file-list="handleBackupSelect"
          :show-file-list="true"
          :max="1"
          accept=".json"
        >
          <NButton>选择备份文件</NButton>
        </NUpload>

        <NAlert v-if="backupStatus === 'success'" type="success">
          {{ backupMessage }}
        </NAlert>
        <NAlert v-else-if="backupStatus === 'error'" type="error">
          {{ backupMessage }}
        </NAlert>
        <NSpin v-else-if="backupStatus === 'loading'" :show="true">
          {{ backupMessage }}
        </NSpin>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBackupModal = false" :disabled="backupStatus === 'loading'">
            取消
          </NButton>
          <NButton
            type="primary"
            @click="handleRestoreBackup"
            :disabled="backupStatus === 'loading' || fileList.length === 0"
          >
            恢复数据
          </NButton>
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

.section-desc {
  margin: 0;
  color: #666;
  font-size: 13px;
}

ul {
  margin: 0;
  padding-left: 20px;
}

li {
  margin: 4px 0;
}
</style>
