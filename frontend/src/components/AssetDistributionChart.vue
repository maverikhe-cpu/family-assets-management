<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import type { AssetDistribution } from '@/types'
import { NEmpty } from 'naive-ui'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

interface Props {
  data: AssetDistribution[]
}

const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.categoryName),
  datasets: [{
    data: props.data.map(d => d.amount),
    backgroundColor: props.data.map(d => d.color),
    borderWidth: 0
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const value = context.raw || 0
          const percentage = props.data[context.dataIndex]?.percentage || 0
          return `¥${value.toLocaleString()} (${percentage.toFixed(1)}%)`
        }
      }
    }
  },
  cutout: '60%'
}

const hasData = computed(() => props.data.length > 0)
</script>

<template>
  <div class="chart-container">
    <Doughnut
      v-if="hasData"
      :data="chartData"
      :options="chartOptions"
      :height="250"
    />
    <NEmpty v-else description="暂无数据" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
