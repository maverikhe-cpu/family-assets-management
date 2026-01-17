<script setup lang="ts">
import { ref, computed, h } from 'vue'
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
  NRadioGroup,
  NRadio,
  NPopconfirm,
  NDivider,
  type DataTableColumns,
  type FormInst
} from 'naive-ui'
import { useTransactionStore } from '@/stores/transactions'
import { useAssetStore } from '@/stores/assets'
import type { Transaction } from '@/types'
import dayjs from 'dayjs'

const transactionStore = useTransactionStore()
const assetStore = useAssetStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const formRef = ref<FormInst | null>(null)
const editingTransaction = ref<Transaction | null>(null)
const transactionType = ref<'income' | 'expense'>('expense')

const formValue = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  categoryId: '',
  accountId: '',
  date: new Date(),
  notes: '',
  tags: [] as string[]
})

// 账户选项（来自资产中的流动资产）
const accountOptions = computed(() => {
  return assetStore.liquidAssets.map(asset => ({
    label: `${asset.name} (¥${asset.currentValue.toLocaleString()})`,
    value: asset.id
  }))
})

const categoryOptions = computed(() => {
  const categories = transactionType.value === 'income'
    ? transactionStore.getIncomeCategories()
    : transactionStore.getExpenseCategories()
  return categories.map(c => ({
    label: `${c.icon} ${c.name}`,
    value: c.id
  }))
})

const columns: DataTableColumns<Transaction> = [
  {
    title: '日期',
    key: 'date',
    render: (row) => dayjs(row.date).format('YYYY-MM-DD')
  },
  {
    title: '类型',
    key: 'type',
    render: (row) => {
      return h(NTag, {
        type: row.type === 'income' ? 'success' : 'error'
      }, {
        default: () => row.type === 'income' ? '收入' : '支出'
      })
    }
  },
  {
    title: '分类',
    key: 'categoryId',
    render: (row) => {
      const cat = transactionStore.getCategoryById(row.categoryId)
      return h('span', {}, cat ? `${cat.icon} ${cat.name}` : '-')
    }
  },
  {
    title: '金额',
    key: 'amount',
    render: (row) => {
      const color = row.type === 'income' ? '#10b981' : '#ef4444'
      return h('span', {
        style: { color, fontWeight: 'bold' }
      }, `${row.type === 'income' ? '+' : '-'}¥${row.amount.toLocaleString()}`)
    }
  },
  {
    title: '备注',
    key: 'notes',
    ellipsis: { tooltip: true }
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
            default: () => '确定删除此记录？',
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

function handleAdd(type?: 'income' | 'expense') {
  transactionType.value = type || 'expense'
  formValue.value = {
    type: transactionType.value,
    amount: 0,
    categoryId: '',
    accountId: '',
    date: new Date(),
    notes: '',
    tags: []
  }
  editingTransaction.value = null
  showAddModal.value = true
}

function handleEdit(transaction: Transaction) {
  editingTransaction.value = transaction
  transactionType.value = transaction.type as 'income' | 'expense'
  formValue.value = {
    type: transaction.type as 'income' | 'expense',
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    date: new Date(transaction.date),
    notes: transaction.notes || '',
    tags: transaction.tags || []
  }
  showEditModal.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()

  const accountId = formValue.value.accountId || accountOptions.value[0]?.value

  if (editingTransaction.value) {
    await transactionStore.updateTransaction(editingTransaction.value.id, {
      ...formValue.value,
      accountId
    })
    showEditModal.value = false
  } else {
    await transactionStore.addTransaction({
      ...formValue.value,
      accountId,
      memberId: 'user_1',
      date: dayjs(formValue.value.date).toISOString()
    })
    showAddModal.value = false
  }

  // 重置表单
  formValue.value = {
    type: 'expense',
    amount: 0,
    categoryId: '',
    accountId: '',
    date: new Date(),
    notes: '',
    tags: []
  }
}

async function handleDelete(id: string) {
  await transactionStore.deleteTransaction(id)
}
</script>

<template>
  <div class="transactions-view">
    <NCard title="收支记录">
      <template #header-extra>
        <NSpace>
          <NButton type="success" @click="handleAdd('income')">记收入</NButton>
          <NButton type="error" @click="handleAdd('expense')">记支出</NButton>
        </NSpace>
      </template>

      <!-- 统计摘要 -->
      <NSpace class="summary" :size="32">
        <div class="summary-item">
          <span class="label">总收入</span>
          <span class="value income">+¥{{ transactionStore.totalIncome.toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="label">总支出</span>
          <span class="value expense">-¥{{ transactionStore.totalExpense.toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="label">净收入</span>
          <span class="value" :class="transactionStore.netIncome >= 0 ? 'income' : 'expense'">
            ¥{{ transactionStore.netIncome.toLocaleString() }}
          </span>
        </div>
      </NSpace>

      <NDivider />

      <NDataTable
        :columns="columns"
        :data="transactionStore.transactions"
        :row-key="(row: Transaction) => row.id"
      />
    </NCard>

    <!-- 添加记录弹窗 -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      :title="transactionType === 'income' ? '记收入' : '记支出'"
      style="width: 500px"
    >
      <NForm ref="formRef" :model="formValue" label-placement="left" label-width="80">
        <NFormItem label="类型" path="type">
          <NRadioGroup v-model:value="formValue.type" @update:value="v => transactionType = v">
            <NRadio value="expense">支出</NRadio>
            <NRadio value="income">收入</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="金额" path="amount" :rule="{ required: true, message: '请输入金额' }">
          <NInputNumber v-model:value="formValue.amount" :min="0" :precision="2" style="width: 100%">
            <template #prefix>¥</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="分类" path="categoryId" :rule="{ required: true, message: '请选择分类' }">
          <NSelect
            v-model:value="formValue.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
          />
        </NFormItem>
        <NFormItem label="账户" path="accountId">
          <NSelect
            v-model:value="formValue.accountId"
            :options="accountOptions"
            placeholder="选择账户"
            clearable
          />
        </NFormItem>
        <NFormItem label="日期" path="date">
          <NDatePicker v-model:value="formValue.date" type="date" style="width: 100%" />
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

    <!-- 编辑记录弹窗 -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="编辑记录"
      style="width: 500px"
    >
      <NForm ref="formRef" :model="formValue" label-placement="left" label-width="80">
        <NFormItem label="类型" path="type">
          <NRadioGroup v-model:value="formValue.type" @update:value="v => transactionType = v">
            <NRadio value="expense">支出</NRadio>
            <NRadio value="income">收入</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="金额" path="amount" :rule="{ required: true, message: '请输入金额' }">
          <NInputNumber v-model:value="formValue.amount" :min="0" :precision="2" style="width: 100%">
            <template #prefix>¥</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="分类" path="categoryId" :rule="{ required: true, message: '请选择分类' }">
          <NSelect
            v-model:value="formValue.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
          />
        </NFormItem>
        <NFormItem label="账户" path="accountId">
          <NSelect
            v-model:value="formValue.accountId"
            :options="accountOptions"
            placeholder="选择账户"
            clearable
          />
        </NFormItem>
        <NFormItem label="日期" path="date">
          <NDatePicker v-model:value="formValue.date" type="date" style="width: 100%" />
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
.transactions-view {
  max-width: 1200px;
  margin: 0 auto;
}

.summary {
  display: flex;
  padding: 16px 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 12px;
  color: #999;
}

.summary-item .value {
  font-size: 20px;
  font-weight: bold;
}

.summary-item .value.income {
  color: #10b981;
}

.summary-item .value.expense {
  color: #ef4444;
}
</style>
