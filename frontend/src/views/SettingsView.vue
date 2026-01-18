<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NSpace, NButton, NModal, NAlert, NSpin, NProgress, NUpload, NInput, NTag, type UploadFileInfo } from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import { useTransactionStore } from '@/stores/transactions'
import { useMemberStore } from '@/stores/members'
import { useAuthStore } from '@/stores/auth'
import { useFamilyStore } from '@/stores/families'
import { usePermission } from '@/composables/usePermission'
import { api } from '@/api/client'
import RoleBadge from '@/components/RoleBadge.vue'
import {
  exportAssetsToExcel,
  exportTransactionsToExcel,
  exportAnnualReport,
  exportBackup,
  importBackup
} from '@/utils/export'

const assetStore = useAssetStore()
const transactionStore = useTransactionStore()
const memberStore = useMemberStore()
const authStore = useAuthStore()
const familyStore = useFamilyStore()
const { isAdmin } = usePermission()

const showImportModal = ref(false)
const showBackupModal = ref(false)
const showInviteModal = ref(false)
const showCreateFamilyModal = ref(false)
const importStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const importMessage = ref('')
const importProgress = ref(0)

// 备份文件上传
const fileList = ref<UploadFileInfo[]>([])
const backupStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const backupMessage = ref('')

// 家庭设置
const newFamilyName = ref('')
const newFamilyDescription = ref('')
const createFamilyStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const createFamilyMessage = ref('')

// 邀请码
const inviteCodeToJoin = ref('')
const joinFamilyStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const joinFamilyMessage = ref('')

// 计算属性
const currentInviteCode = computed(() => familyStore.currentFamily?.inviteCode || '')
const familyMemberCount = computed(() => familyStore.currentFamily?.members?.length || 0)

// 加载家庭数据
onMounted(async () => {
  try {
    await familyStore.fetchFamilies()
    if (authStore.user?.familyId) {
      await familyStore.fetchFamily(authStore.user.familyId)
    }
  } catch (error) {
    console.error('Failed to load family data:', error)
  }
})

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
function handleBackupSelect(fileListParam: UploadFileInfo[]) {
  fileList.value = fileListParam
}

// 处理备份恢复
async function handleRestoreBackup() {
  if (fileList.value.length === 0) {
    backupMessage.value = '请先选择备份文件'
    backupStatus.value = 'error'
    return
  }

  const fileOrUndefined = fileList.value[0]?.file
  const file = fileOrUndefined!
  if (!file) {
    backupMessage.value = '文件读取失败'
    backupStatus.value = 'error'
    return
  }

  backupStatus.value = 'loading'
  backupMessage.value = '正在恢复数据...'

  try {
    const backup = await importBackup(file)

    // 确保分类已加载
    if (assetStore.categories.length === 0) {
      await assetStore.loadCategories()
    }

    // 建立分类名称到ID的映射
    const categories = assetStore.categories
    const categoryNameToId = new Map<string, string>()
    for (const cat of categories) {
      categoryNameToId.set(cat.name, cat.id)
    }

    let assetCount = 0
    let txnCount = 0

    // 恢复资产到后端
    if (backup.data.assets?.length > 0) {
      for (const asset of backup.data.assets) {
        try {
          const categoryId = categoryNameToId.get(asset.categoryName) || asset.categoryId
          if (categoryId) {
            await api.assets.create({
              name: asset.name,
              categoryId,
              initialValue: asset.initialValue,
              currentValue: asset.currentValue,
              currency: asset.currency || 'CNY',
              purchaseDate: asset.purchaseDate || new Date().toISOString().split('T')[0],
              status: asset.status || 'active',
              notes: asset.notes || '',
              holderName: asset.holderName || '本人'
            })
            assetCount++
          }
        } catch (err) {
          console.error('恢复资产失败:', asset.name, err)
        }
      }
    }

    // 恢复交易到后端
    if (backup.data.transactions?.length > 0) {
      for (const txn of backup.data.transactions) {
        try {
          await api.transactions.create({
            type: txn.type,
            categoryId: txn.categoryId,
            amount: txn.amount,
            date: txn.date,
            memberId: txn.memberId,
            notes: txn.notes || ''
          })
          txnCount++
        } catch (err) {
          console.error('恢复交易失败:', txn, err)
        }
      }
    }

    // 重新加载数据
    await assetStore.loadAssets()
    await transactionStore.loadTransactions()

    backupStatus.value = 'success'
    backupMessage.value = `恢复成功！共恢复 ${assetCount} 项资产，${txnCount} 条交易`

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
  importMessage.value = '正在加载数据文件...'
  importProgress.value = 0

  try {
    // 确保分类已加载
    if (assetStore.categories.length === 0) {
      await assetStore.loadCategories()
    }

    // 获取导入数据文件
    let data: any[]
    try {
      // 尝试从 public 目录获取
      const response = await fetch(import.meta.env.BASE_URL + 'import-data.json')
      if (!response.ok) throw new Error('文件加载失败')
      data = await response.json()
    } catch {
      // 如果 fetch 失败，使用内嵌的默认数据
      data = [
        { name: '保诚养老金', categoryName: '保险', parentCategory: '投资资产', holderName: '本人', initialValue: 280000, currentValue: 280000, currency: 'USD', purchaseDate: '2024-01-01', status: 'active', notes: '资产属性: 投资理财' },
        { name: '渣打活期', categoryName: '银行存款', parentCategory: '流动资产', holderName: '本人', initialValue: 100000, currentValue: 100000, currency: 'CNY', purchaseDate: '2024-01-01', status: 'active', notes: '流动资金' },
        { name: '现金', categoryName: '现金', parentCategory: '流动资产', holderName: '本人', initialValue: 10000, currentValue: 10000, currency: 'CNY', purchaseDate: '2024-01-01', status: 'active', notes: '日常现金' },
      ]
      importMessage.value = '使用内置默认数据（数据文件加载失败）'
    }

    importProgress.value = 30
    importMessage.value = `找到 ${data.length} 条资产记录`

    // 建立分类名称到ID的映射
    const categories = assetStore.categories
    const categoryNameToId = new Map<string, string>()
    for (const cat of categories) {
      categoryNameToId.set(cat.name, cat.id)
    }

    // 导入资产到后端
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const categoryId = categoryNameToId.get(item.categoryName)

      if (!categoryId) {
        console.warn(`未找到分类: ${item.categoryName}`)
        failCount++
        continue
      }

      try {
        await api.assets.create({
          name: item.name,
          categoryId,
          initialValue: item.initialValue,
          currentValue: item.currentValue,
          currency: item.currency || 'CNY',
          purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
          status: item.status || 'active',
          notes: item.notes || '',
          holderName: item.holderName || '本人'
        })
        successCount++
      } catch (err) {
        console.error(`导入资产失败: ${item.name}`, err)
        failCount++
      }

      importProgress.value = 30 + Math.floor((i + 1) / data.length * 50)
      importMessage.value = `正在导入... (${i + 1}/${data.length})`
    }

    importProgress.value = 90
    importMessage.value = `正在刷新数据...`

    // 重新加载数据
    await assetStore.loadAssets()

    importProgress.value = 100
    importStatus.value = 'success'
    importMessage.value = `导入完成！成功 ${successCount} 条` + (failCount > 0 ? `，失败 ${failCount} 条` : '')

    setTimeout(() => {
      showImportModal.value = false
      importStatus.value = 'idle'
      importProgress.value = 0
      importMessage.value = ''
    }, 3000)
  } catch (error: any) {
    importStatus.value = 'error'
    importMessage.value = `导入失败：${error.message || error}`
  }
}

// 清空数据（已禁用 - 数据存储在后端）
async function handleClear() {
  alert('数据现在存储在服务器上，请通过后端管理界面清空数据')
}

// 重置分类（已禁用 - 分类由后端管理）
async function handleResetCategories() {
  alert('分类现在由后端管理，请通过后端管理界面重置')
}

// 创建家庭
async function handleCreateFamily() {
  if (!newFamilyName.value.trim()) {
    createFamilyMessage.value = '请输入家庭名称'
    createFamilyStatus.value = 'error'
    return
  }

  createFamilyStatus.value = 'loading'
  createFamilyMessage.value = '正在创建家庭...'

  try {
    await familyStore.createFamily({
      name: newFamilyName.value,
      description: newFamilyDescription.value
    })

    createFamilyStatus.value = 'success'
    createFamilyMessage.value = '家庭创建成功！'

    setTimeout(() => {
      showCreateFamilyModal.value = false
      newFamilyName.value = ''
      newFamilyDescription.value = ''
      createFamilyStatus.value = 'idle'
      createFamilyMessage.value = ''
    }, 2000)
  } catch (error: any) {
    createFamilyStatus.value = 'error'
    createFamilyMessage.value = error.response?.data?.message || '创建失败'
  }
}

// 通过邀请码加入家庭
async function handleJoinFamily() {
  if (!inviteCodeToJoin.value.trim()) {
    joinFamilyMessage.value = '请输入邀请码'
    joinFamilyStatus.value = 'error'
    return
  }

  joinFamilyStatus.value = 'loading'
  joinFamilyMessage.value = '正在加入家庭...'

  try {
    await familyStore.joinByInviteCode(inviteCodeToJoin.value.trim())

    joinFamilyStatus.value = 'success'
    joinFamilyMessage.value = '成功加入家庭！'

    setTimeout(() => {
      showInviteModal.value = false
      inviteCodeToJoin.value = ''
      joinFamilyStatus.value = 'idle'
      joinFamilyMessage.value = ''
      location.reload()
    }, 2000)
  } catch (error: any) {
    joinFamilyStatus.value = 'error'
    joinFamilyMessage.value = error.response?.data?.message || '加入失败'
  }
}

// 重新生成邀请码
async function handleRegenerateInviteCode() {
  if (!familyStore.currentFamily?.id) return

  try {
    const result = await api.families.regenerateInviteCode(familyStore.currentFamily.id)
    await familyStore.fetchFamily(familyStore.currentFamily.id)
    return result.inviteCode
  } catch (error: any) {
    console.error('Failed to regenerate invite code:', error)
    throw error
  }
}

// 复制邀请链接
function getInviteLink() {
  const code = currentInviteCode.value
  if (!code) return ''
  return `${window.location.origin}/join?code=${code}`
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// 复制邀请码
async function copyInviteCode() {
  await copyToClipboard(currentInviteCode.value)
}

// 复制邀请链接
async function copyInviteLink() {
  await copyToClipboard(getInviteLink())
}
</script>

<template>
  <div class="settings-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">设置</h2>
      <p class="page-subtitle">数据管理与导出</p>
    </div>

    <NSpace vertical :size="24">
      <!-- Excel 导出 -->
      <NCard title="导出到 Excel" class="setting-card">
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

      <!-- 家庭设置 -->
      <NCard title="家庭设置" class="setting-card">
        <NSpace vertical :size="16">
          <!-- 当前家庭信息 -->
          <div v-if="familyStore.currentFamily" class="family-info">
            <div class="family-header">
              <div>
                <h4 class="family-name">{{ familyStore.currentFamily.name }}</h4>
                <p class="family-desc">{{ familyStore.currentFamily.description || '暂无描述' }}</p>
              </div>
              <RoleBadge :role="authStore.familyRole || 'viewer'" />
            </div>
            <div class="family-stats">
              <NTag type="info" size="small">
                👥 {{ familyMemberCount }} 位成员
              </NTag>
            </div>
          </div>

          <!-- 邀请码区域 -->
          <div v-if="familyStore.currentFamily" class="invite-section">
            <div class="invite-header">
              <p class="section-title">家庭邀请码</p>
              <p class="section-desc">分享邀请码邀请家庭成员</p>
            </div>
            <div class="invite-code-container">
              <span class="invite-code">{{ currentInviteCode }}</span>
              <NButton size="small" @click="copyInviteCode">
                📋 复制
              </NButton>
              <NButton
                v-if="isAdmin"
                size="small"
                quaternary
                type="primary"
                @click="handleRegenerateInviteCode"
              >
                🔄 重新生成
              </NButton>
            </div>
            <div class="invite-link">
              <p class="section-desc">邀请链接：</p>
              <div class="invite-link-row">
                <span class="link-text">{{ getInviteLink() }}</span>
                <NButton size="small" text @click="copyInviteLink">📋</NButton>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <NSpace :size="12">
            <NButton v-if="!familyStore.currentFamily" type="primary" @click="showCreateFamilyModal = true">
              ➕ 创建家庭
            </NButton>
            <NButton v-if="!familyStore.currentFamily" @click="showInviteModal = true">
              📨 通过邀请码加入
            </NButton>
          </NSpace>
        </NSpace>
      </NCard>

      <!-- 数据备份与恢复 -->
      <NCard title="数据备份与恢复" class="setting-card">
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
      <NCard title="导入初始数据" class="setting-card">
        <NSpace vertical :size="12">
          <p>从预置数据文件导入初始资产数据（{{ assetStore.assets.length > 0 ? '已有数据，导入将追加' : '包含33条资产记录' }}）</p>
          <p class="section-desc">包含资产：房产、股票基金、银行存款、保险等，支持多币种（CNY/USD/HKD/GBP）</p>
          <NButton type="primary" @click="showImportModal = true">导入初始数据</NButton>
        </NSpace>
      </NCard>

      <!-- 数据管理 -->
      <NCard title="数据管理" class="setting-card">
        <NSpace vertical :size="12">
          <p>重置分类为默认模板</p>
          <NButton @click="handleResetCategories">重置分类</NButton>
        </NSpace>
      </NCard>

      <!-- 危险区域 -->
      <NCard title="危险区域" class="setting-card setting-card--danger">
        <NAlert type="error" title="警告" style="margin-bottom: 12px">
          以下操作不可逆，请谨慎操作
        </NAlert>
        <NSpace vertical :size="12">
          <p>清空所有数据（资产、交易记录等），但保留默认分类</p>
          <NButton type="error" @click="handleClear">清空所有数据</NButton>
        </NSpace>
      </NCard>

      <!-- 关于 -->
      <NCard title="关于" class="setting-card">
        <NSpace vertical>
          <p><strong>家庭资产管家</strong></p>
          <p>版本：1.0.0 (MVP)</p>
          <p>数据存储：云端服务器（支持多设备同步）</p>
          <p class="section-desc">数据存储在您的家庭账户中，可在任何设备上登录访问</p>
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
        <ul class="import-list">
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
        <p class="warning-text">⚠️ 恢复将覆盖现有所有数据，请谨慎操作</p>

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

    <!-- 创建家庭弹窗 -->
    <NModal
      v-model:show="showCreateFamilyModal"
      preset="card"
      title="创建新家庭"
      style="width: 500px"
    >
      <NSpace vertical :size="16">
        <p>创建一个新的家庭，您可以邀请家庭成员加入</p>

        <NInput
          v-model:value="newFamilyName"
          placeholder="请输入家庭名称"
          maxlength="50"
          show-count
        />

        <NInput
          v-model:value="newFamilyDescription"
          type="textarea"
          placeholder="家庭描述（可选）"
          maxlength="200"
          show-count
          :rows="3"
        />

        <NAlert v-if="createFamilyStatus === 'success'" type="success">
          {{ createFamilyMessage }}
        </NAlert>
        <NAlert v-else-if="createFamilyStatus === 'error'" type="error">
          {{ createFamilyMessage }}
        </NAlert>
        <NSpin v-else-if="createFamilyStatus === 'loading'" :show="true">
          {{ createFamilyMessage }}
        </NSpin>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateFamilyModal = false" :disabled="createFamilyStatus === 'loading'">
            取消
          </NButton>
          <NButton
            type="primary"
            @click="handleCreateFamily"
            :disabled="createFamilyStatus === 'loading' || !newFamilyName.trim()"
          >
            创建
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 通过邀请码加入弹窗 -->
    <NModal
      v-model:show="showInviteModal"
      preset="card"
      title="通过邀请码加入家庭"
      style="width: 500px"
    >
      <NSpace vertical :size="16">
        <p>输入家庭邀请码以加入该家庭</p>

        <NInput
          v-model:value="inviteCodeToJoin"
          placeholder="请输入6位邀请码"
          maxlength="6"
          style="text-transform: uppercase"
        />

        <NAlert v-if="joinFamilyStatus === 'success'" type="success">
          {{ joinFamilyMessage }}
        </NAlert>
        <NAlert v-else-if="joinFamilyStatus === 'error'" type="error">
          {{ joinFamilyMessage }}
        </NAlert>
        <NSpin v-else-if="joinFamilyStatus === 'loading'" :show="true">
          {{ joinFamilyMessage }}
        </NSpin>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showInviteModal = false" :disabled="joinFamilyStatus === 'loading'">
            取消
          </NButton>
          <NButton
            type="primary"
            @click="handleJoinFamily"
            :disabled="joinFamilyStatus === 'loading' || !inviteCodeToJoin.trim()"
          >
            加入
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

/* 设置卡片 */
.setting-card {
  margin-bottom: 24px;
}

.setting-card--danger {
  border-color: var(--color-error);
}

.section-desc {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.warning-text {
  color: var(--color-error);
  font-size: 12px;
}

.import-list {
  margin: 0;
  padding-left: 20px;
}

.import-list li {
  margin: 4px 0;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .settings-view {
    max-width: 100%;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .setting-card {
    margin-bottom: 12px;
  }

  .section-desc {
    font-size: 12px;
  }

  /* 按钮适配 */
  .setting-card :deep(.n-space) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px !important;
  }

  .setting-card :deep(.n-button) {
    flex: 1;
    min-width: calc(50% - 4px);
  }

  /* 弹窗适配 */
  :deep(.n-modal) {
    max-width: 100vw;
  }

  :deep(.n-card) {
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
  }
}

/* 家庭设置样式 */
.family-info {
  padding: 12px;
  background-color: var(--n-color-modal);
  border-radius: 8px;
}

.family-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.family-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.family-desc {
  margin: 0;
  font-size: 13px;
  color: var(--n-text-color-3);
}

.family-stats {
  display: flex;
  gap: 8px;
}

.invite-section {
  padding: 12px;
  background-color: var(--n-color-modal);
  border-radius: 8px;
}

.invite-header {
  margin-bottom: 12px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
}

.invite-code-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.invite-code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  flex: 1;
  padding: 8px 12px;
  background-color: var(--n-color-target);
  border-radius: 6px;
  text-align: center;
}

.invite-link {
  margin-top: 8px;
}

.invite-link .section-desc {
  margin: 0 0 4px 0;
  font-size: 12px;
}

.invite-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-link-row .link-text {
  font-size: 12px;
  word-break: break-all;
  color: var(--n-text-color-2);
}
</style>
