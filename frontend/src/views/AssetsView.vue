<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NDataTable,
  NTag,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NPopconfirm,
  NInputGroup,
  NEmpty,
  type DataTableColumns,
  type FormInst
} from 'naive-ui'
import { useAssetStore } from '@/stores/assets'
import { useMemberStore } from '@/stores/members'
import type { Asset } from '@/types'
import { formatAssetValue, currencySymbols } from '@/utils/currency'
import dayjs from 'dayjs'

const router = useRouter()
const assetStore = useAssetStore()
const memberStore = useMemberStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const formRef = ref<FormInst | null>(null)
const editingAsset = ref<Asset | null>(null)

// 批量选择
const checkedRowKeys = ref<Array<string | number>>([])
const showBatchActions = computed(() => checkedRowKeys.value.length > 0)

// 搜索和筛选
const searchText = ref('')
const filterCategory = ref<string>('')
const filterCurrency = ref<string>('')
const filterStatus = ref<string>('')
const filterMember = ref<string>('')

// 初始化加载成员
onMounted(async () => {
  await memberStore.loadMembers()
})

// 排序
const sortField = ref<string>('purchaseDate')
const sortOrder = ref<'ascend' | 'descend'>('descend')

// 筛选选项
const categoryFilterOptions = computed(() => {
  return [
    { label: '全部分类', value: '' },
    ...assetStore.categories
      .filter(c => c.parentId)
      .map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
  ]
})

const currencyFilterOptions = [
  { label: '全部币种', value: '' },
  { label: 'CNY (¥)', value: 'CNY' },
  { label: 'HKD (HK$)', value: 'HKD' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'EUR (€)', value: 'EUR' }
]

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  { label: '持有中', value: 'active' },
  { label: '已处置', value: 'disposed' },
  { label: '待处理', value: 'pending' }
]

// 成员筛选选项
const memberFilterOptions = computed(() => {
  return [
    { label: '全部成员', value: '' },
    ...memberStore.members.map(m => ({
      label: m.name,
      value: m.id
    }))
  ]
})

// 表单成员选项
const memberFormOptions = computed(() => {
  return memberStore.members.map(m => ({
    label: m.name,
    value: m.id
  }))
})

// 排序选项
const sortOptions = [
  { label: '按购买日期', value: 'purchaseDate' },
  { label: '按当前价值', value: 'currentValue' },
  { label: '按资产名称', value: 'name' }
]

// 过滤和排序后的数据
const filteredAndSortedAssets = computed(() => {
  let result = [...assetStore.assets]

  // 搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    result = result.filter(asset =>
      asset.name.toLowerCase().includes(searchLower) ||
      (asset.notes && asset.notes.toLowerCase().includes(searchLower))
    )
  }

  // 分类过滤
  if (filterCategory.value !== '') {
    result = result.filter(asset => asset.categoryId === filterCategory.value)
  }

  // 币种过滤
  if (filterCurrency.value !== '') {
    result = result.filter(asset => asset.currency === filterCurrency.value)
  }

  // 状态过滤
  if (filterStatus.value !== '') {
    result = result.filter(asset => asset.status === filterStatus.value)
  }

  // 成员过滤
  if (filterMember.value !== '') {
    result = result.filter(asset => asset.holderId === filterMember.value)
  }

  // 排序
  result.sort((a, b) => {
    let compareResult = 0
    switch (sortField.value) {
      case 'currentValue':
        // 按价值排序（转换为基准货币比较）
        const valueA = a.currentValue * (currencySymbols[a.currency] ? 1 : 1)
        const valueB = b.currentValue * (currencySymbols[b.currency] ? 1 : 1)
        compareResult = valueA - valueB
        break
      case 'name':
        compareResult = a.name.localeCompare(b.name, 'zh-CN')
        break
      case 'purchaseDate':
      default:
        compareResult = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
        break
    }
    return sortOrder.value === 'descend' ? -compareResult : compareResult
  })

  return result
})

// 清空筛选
function handleClearFilters() {
  searchText.value = ''
  filterCategory.value = ''
  filterCurrency.value = ''
  filterStatus.value = ''
  filterMember.value = ''
  sortField.value = 'purchaseDate'
  sortOrder.value = 'descend'
}

// 切换排序
function toggleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  } else {
    sortField.value = field
    sortOrder.value = 'descend'
  }
}

// 基准货币
const baseCurrency = 'CNY'

// 货币选项
const currencyOptions = [
  { label: 'CNY (¥)', value: 'CNY' },
  { label: 'HKD (HK$)', value: 'HKD' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'EUR (€)', value: 'EUR' }
]

const formValue = ref({
  name: '',
  categoryId: '',
  holderId: 'member_owner',
  initialValue: 0,
  currentValue: 0,
  currency: 'CNY',
  purchaseDate: Date.now(),
  notes: ''
})

const categoryOptions = computed(() => {
  return assetStore.categories
    .filter(c => c.parentId) // 只显示二级分类
    .map(c => ({
      label: `${c.icon} ${c.name}`,
      value: c.id
    }))
})

const columns: DataTableColumns<Asset> = [
  {
    type: 'selection'
  },
  {
    title: '名称',
    key: 'name',
    ellipsis: { tooltip: true },
    width: 200
  },
  {
    title: '分类',
    key: 'categoryId',
    render: (row) => {
      const cat = assetStore.getCategoryById(row.categoryId)
      return h('span', {}, cat ? `${cat.icon} ${cat.name}` : '-')
    }
  },
  {
    title: '成员',
    key: 'holderId',
    width: 100,
    render: (row) => {
      const member = memberStore.getMemberById(row.holderId)
      return member
        ? h(NTag, {
            size: 'small',
            style: { backgroundColor: member.color + '20', color: member.color, border: `1px solid ${member.color}40` }
          }, { default: () => member.name })
        : h('span', { style: { color: '#999' } }, '未设置')
    }
  },
  {
    title: '当前价值',
    key: 'currentValue',
    render: (row) => {
      const value = formatAssetValue(row.currentValue, row.currency, baseCurrency)
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } }, [
        h('span', { style: { fontWeight: 'bold' } }, value.original),
        value.converted ? h('span', { style: { fontSize: '12px', color: '#999' } }, value.converted) : null
      ])
    }
  },
  {
    title: '币种',
    key: 'currency',
    width: 80,
    render: (row) => currencySymbols[row.currency] || row.currency
  },
  {
    title: '购买日期',
    key: 'purchaseDate',
    width: 120,
    render: (row) => dayjs(row.purchaseDate).format('YYYY-MM-DD')
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const statusConfig: Record<string, { type: 'success' | 'warning' | 'error'; text: string }> = {
        active: { type: 'success', text: '持有中' },
        disposed: { type: 'error', text: '已处置' },
        pending: { type: 'warning', text: '待处理' }
      }
      const rowStatus = row.status!
      const config = statusConfig[rowStatus] || statusConfig.active!
      return h(NTag, { type: config.type }, { default: () => config.text })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => {
      return h(NSpace, null, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => handleEdit(row)
          }, { default: () => '编辑' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDelete(row.id)
          }, {
            default: () => '确定删除此资产？',
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error'
            }, { default: () => '删除' })
          })
        ]
      })
    }
  }
]

function handleAdd() {
  formValue.value = {
    name: '',
    categoryId: '',
    holderId: 'member_owner',
    initialValue: 0,
    currentValue: 0,
    currency: 'CNY',
    purchaseDate: Date.now(),
    notes: ''
  }
  editingAsset.value = null
  showAddModal.value = true
}

function handleEdit(asset: Asset) {
  editingAsset.value = asset
  formValue.value = {
    name: asset.name,
    categoryId: asset.categoryId,
    holderId: asset.holderId || 'member_owner',
    initialValue: asset.initialValue,
    currentValue: asset.currentValue,
    currency: asset.currency,
    purchaseDate: new Date(asset.purchaseDate).getTime(),
    notes: asset.notes || ''
  }
  showEditModal.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()

  const purchaseDateStr = dayjs(formValue.value.purchaseDate as number).toISOString()

  if (editingAsset.value) {
    await assetStore.updateAsset(editingAsset.value.id, {
      name: formValue.value.name,
      categoryId: formValue.value.categoryId,
      holderId: formValue.value.holderId,
      initialValue: formValue.value.initialValue,
      currentValue: formValue.value.currentValue,
      currency: formValue.value.currency,
      purchaseDate: purchaseDateStr,
      notes: formValue.value.notes
    })
    showEditModal.value = false
  } else {
    await assetStore.addAsset({
      name: formValue.value.name,
      categoryId: formValue.value.categoryId,
      holderId: formValue.value.holderId,
      initialValue: formValue.value.initialValue,
      currentValue: formValue.value.currentValue,
      currency: formValue.value.currency,
      purchaseDate: purchaseDateStr,
      status: 'active',
      notes: formValue.value.notes
    })
    showAddModal.value = false
  }
}

async function handleDelete(id: string) {
  await assetStore.deleteAsset(id)
}

// 批量删除
async function handleBatchDelete() {
  for (const id of checkedRowKeys.value) {
    await assetStore.deleteAsset(String(id))
  }
  checkedRowKeys.value = []
}

// 清空选择
function handleClearSelection() {
  checkedRowKeys.value = []
}

function handleRowClick(row: Asset) {
  // 如果有选中的行，不进行跳转（避免误操作）
  if (checkedRowKeys.value.length > 0) return
  router.push(`/assets/${row.id}`)
}

function getCurrencySymbol(currency: string) {
  return currencySymbols[currency] || currency
}
</script>

<template>
  <div class="assets-view">
    <NCard title="资产管理">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" @click="handleAdd">添加资产</NButton>
          <NPopconfirm
            v-if="showBatchActions"
            @positive-click="handleBatchDelete"
          >
            <template #trigger>
              <NButton type="error">批量删除 ({{ checkedRowKeys.length }})</NButton>
            </template>
            确定删除选中的 {{ checkedRowKeys.length }} 个资产？
          </NPopconfirm>
          <NButton v-if="showBatchActions" @click="handleClearSelection">取消选择</NButton>
        </NSpace>
      </template>

      <!-- 搜索和筛选栏 -->
      <div class="filter-bar">
        <NSpace vertical :size="12">
          <!-- 搜索和排序 -->
          <div class="filter-row">
            <NInputGroup style="flex: 1">
              <NInput
                v-model:value="searchText"
                placeholder="搜索资产名称或备注..."
                clearable
              >
                <template #prefix>🔍</template>
              </NInput>
            </NInputGroup>
            <NSelect
              v-model:value="sortField"
              :options="sortOptions"
              style="width: 140px"
              @update:value="() => sortOrder = 'descend'"
            />
            <NButton
              :type="sortOrder === 'ascend' ? 'primary' : 'default'"
              @click="toggleSort(sortField)"
            >
              {{ sortOrder === 'ascend' ? '↑ 升序' : '↓ 降序' }}
            </NButton>
          </div>

          <!-- 筛选条件 -->
          <div class="filter-row">
            <NSelect
              v-model:value="filterCategory"
              :options="categoryFilterOptions"
              placeholder="选择分类"
              clearable
              style="width: 140px"
            />
            <NSelect
              v-model:value="filterCurrency"
              :options="currencyFilterOptions"
              placeholder="选择币种"
              clearable
              style="width: 130px"
            />
            <NSelect
              v-model:value="filterMember"
              :options="memberFilterOptions"
              placeholder="选择成员"
              clearable
              style="width: 120px"
            />
            <NSelect
              v-model:value="filterStatus"
              :options="statusFilterOptions"
              placeholder="选择状态"
              clearable
              style="width: 120px"
            />
            <NButton
              v-if="searchText || filterCategory || filterCurrency || filterMember || filterStatus"
              @click="handleClearFilters"
            >
              清空筛选
            </NButton>
            <div style="margin-left: auto; color: #999; font-size: 12px;">
              共 {{ filteredAndSortedAssets.length }} 项
            </div>
          </div>
        </NSpace>
      </div>

      <!-- 数据表格 -->
      <NDataTable
        v-if="filteredAndSortedAssets.length > 0"
        :columns="columns"
        :data="filteredAndSortedAssets"
        :row-key="(row: Asset) => row.id"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="(keys: Array<string | number>) => checkedRowKeys = keys"
        @row-click="handleRowClick"
      />
      <NEmpty v-else description="没有找到符合条件的资产" />
    </NCard>

    <!-- 添加资产弹窗 -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      title="添加资产"
      style="width: 500px"
    >
      <NForm ref="formRef" :model="formValue" label-placement="left" label-width="90">
        <NFormItem label="资产名称" path="name" :rule="{ required: true, message: '请输入资产名称' }">
          <NInput v-model:value="formValue.name" placeholder="如：招商银行储蓄卡" />
        </NFormItem>
        <NFormItem label="资产分类" path="categoryId" :rule="{ required: true, message: '请选择分类' }">
          <NSelect
            v-model:value="formValue.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
          />
        </NFormItem>
        <NFormItem label="所属成员" path="holderId">
          <NSelect
            v-model:value="formValue.holderId"
            :options="memberFormOptions"
            placeholder="选择成员"
          />
        </NFormItem>
        <NFormItem label="币种" path="currency">
          <NSelect
            v-model:value="formValue.currency"
            :options="currencyOptions"
            placeholder="选择币种"
          />
        </NFormItem>
        <NFormItem label="初始金额" path="initialValue">
          <NInputNumber v-model:value="formValue.initialValue" :min="0" style="width: 100%">
            <template #prefix>{{ getCurrencySymbol(formValue.currency) }}</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="当前估值" path="currentValue" :rule="{ required: true, message: '请输入当前估值' }">
          <NInputNumber v-model:value="formValue.currentValue" :min="0" style="width: 100%">
            <template #prefix>{{ getCurrencySymbol(formValue.currency) }}</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="购买日期" path="purchaseDate">
          <NDatePicker v-model:value="formValue.purchaseDate" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="备注" path="notes">
          <NInput v-model:value="formValue.notes" type="textarea" placeholder="选填" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAddModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 编辑资产弹窗 -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="编辑资产"
      style="width: 500px"
    >
      <NForm ref="formRef" :model="formValue" label-placement="left" label-width="90">
        <NFormItem label="资产名称" path="name" :rule="{ required: true, message: '请输入资产名称' }">
          <NInput v-model:value="formValue.name" placeholder="如：招商银行储蓄卡" />
        </NFormItem>
        <NFormItem label="资产分类" path="categoryId" :rule="{ required: true, message: '请选择分类' }">
          <NSelect
            v-model:value="formValue.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
          />
        </NFormItem>
        <NFormItem label="所属成员" path="holderId">
          <NSelect
            v-model:value="formValue.holderId"
            :options="memberFormOptions"
            placeholder="选择成员"
          />
        </NFormItem>
        <NFormItem label="币种" path="currency">
          <NSelect
            v-model:value="formValue.currency"
            :options="currencyOptions"
            placeholder="选择币种"
          />
        </NFormItem>
        <NFormItem label="初始金额" path="initialValue">
          <NInputNumber v-model:value="formValue.initialValue" :min="0" style="width: 100%">
            <template #prefix>{{ getCurrencySymbol(formValue.currency) }}</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="当前估值" path="currentValue" :rule="{ required: true, message: '请输入当前估值' }">
          <NInputNumber v-model:value="formValue.currentValue" :min="0" style="width: 100%">
            <template #prefix>{{ getCurrencySymbol(formValue.currency) }}</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="购买日期" path="purchaseDate">
          <NDatePicker v-model:value="formValue.purchaseDate" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="备注" path="notes">
          <NInput v-model:value="formValue.notes" type="textarea" placeholder="选填" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.assets-view {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-bar {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

:deep(.n-data-table .n-data-table-td) {
  cursor: pointer;
}

:deep(.n-data-table .n-data-table-td:hover) {
  background-color: #f5f5f5;
}

:deep(.n-select) {
  min-width: 120px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .assets-view {
    max-width: 100%;
  }

  .filter-bar {
    margin-bottom: 12px;
  }

  .filter-row {
    gap: 8px;
  }

  /* 筛选器适配 */
  .filter-row :deep(.n-input-group),
  .filter-row :deep(.n-select) {
    width: 100% !important;
    min-width: unset !important;
  }

  .filter-row :deep(.n-button) {
    flex: 1;
    min-width: calc(50% - 4px);
  }

  /* 表格滚动 */
  :deep(.n-data-table) {
    overflow-x: auto;
  }

  :deep(.n-data-table-wrapper) {
    overflow-x: auto;
  }

  /* 隐藏部分列在移动端 */
  :deep(.n-data-table-th__selection),
  :deep(.n-data-table-td__selection) {
    display: none;
  }

  /* 弹窗适配 */
  :deep(.n-modal) {
    max-width: 100vw;
  }

  :deep(.n-modal .n-card) {
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
  }

  /* 按钮适配 */
  :deep(.n-space) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px !important;
  }

  :deep(.n-space .n-button) {
    flex: 1;
    min-width: calc(50% - 4px);
  }
}
</style>
