<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

interface Props {
  name: string
  size?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 18,
  color: undefined
})
</script>

<template>
  <IconifyIcon :icon="name" :width="size" :height="size" :color="color" />
</template>
