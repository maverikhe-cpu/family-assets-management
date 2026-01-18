import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { registerDirectives } from './directives'

// Naive UI
import {
  create,
  NButton,
  NCard,
  NInput,
  NInputNumber,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NModal,
  NSpin,
  NEmpty,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NStatistic,
  NNumberAnimation,
  NDataTable,
  NSpace,
  NTag,
  NDivider,
  NDescriptions,
  NDescriptionsItem,
  NRadioGroup,
  NRadio,
  NGrid,
  NGridItem,
  NAlert,
  NPopconfirm,
  NTooltip,
  NConfigProvider,
  NProgress,
  NGlobalStyle
} from 'naive-ui'

const naive = create({
  components: [
    NButton,
    NCard,
    NInput,
    NInputNumber,
    NForm,
    NFormItem,
    NSelect,
    NDatePicker,
    NModal,
    NSpin,
    NEmpty,
    NLayout,
    NLayoutSider,
    NLayoutContent,
    NMenu,
    NStatistic,
    NNumberAnimation,
    NDataTable,
    NSpace,
    NTag,
    NDivider,
    NDescriptions,
    NDescriptionsItem,
    NRadioGroup,
    NRadio,
    NGrid,
    NGridItem,
    NAlert,
    NPopconfirm,
    NTooltip,
    NConfigProvider,
    NProgress,
    NGlobalStyle
  ]
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

// Register custom directives
registerDirectives(app)

app.mount('#app')
