/**
 * 全局主题配置
 * 定义统一的颜色、间距、圆角等设计 token
 */

// 语义化颜色
export const colors = {
  // 主色调
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryActive: '#1D4ED8',
  primaryLight: 'rgba(59, 130, 246, 0.1)',

  // 成功/收入
  success: '#10B981',
  successHover: '#059669',
  successLight: 'rgba(16, 185, 129, 0.1)',

  // 警告
  warning: '#F59E0B',
  warningHover: '#D97706',
  warningLight: 'rgba(245, 158, 11, 0.1)',

  // 错误/支出
  error: '#EF4444',
  errorHover: '#DC2626',
  errorLight: 'rgba(239, 68, 68, 0.1)',

  // 信息
  info: '#6B7280',
  infoHover: '#4B5563',
  infoLight: 'rgba(107, 114, 128, 0.1)',

  // 中性色
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',

  // 图表颜色序列
  chart: [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#F59E0B', // 橙色
    '#EF4444', // 红色
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
    '#06B6D4', // 青色
    '#84CC16', // 黄绿色
  ]
} as const

// 间距系统 (4px 基准)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const

// 圆角
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

// 字体大小
export const fontSize = {
  xs: '12px',
  sm: '13px',
  base: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px',
  xxxl: '30px',
} as const

// 阴影
export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const

// Naive UI 主题配置
export const themeOverrides = {
  common: {
    primaryColor: colors.primary,
    primaryColorHover: colors.primaryHover,
    primaryColorPressed: colors.primaryActive,
    primaryColorSuppl: colors.primaryLight,

    successColor: colors.success,
    successColorHover: colors.successHover,
    successColorPressed: colors.successHover,
    successColorSuppl: colors.successLight,

    warningColor: colors.warning,
    warningColorHover: colors.warningHover,
    warningColorPressed: colors.warningHover,
    warningColorSuppl: colors.warningLight,

    errorColor: colors.error,
    errorColorHover: colors.errorHover,
    errorColorPressed: colors.errorHover,
    errorColorSuppl: colors.errorLight,

    infoColor: colors.info,
    infoColorHover: colors.infoHover,

    textColorBase: colors.text,
    textColor1: colors.text,
    textColor2: colors.textSecondary,
    textColor3: colors.textTertiary,

    borderColor: colors.border,
    dividerColor: colors.borderLight,

    bodyColor: colors.background,
    cardColor: colors.background,
    modalColor: colors.background,
    popoverColor: colors.background,

    borderRadius: borderRadius.md,
    borderRadiusSmall: borderRadius.sm,
  },
  Card: {
    color: colors.background,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingSmall: spacing.lg,
    paddingMedium: spacing.xxl,
    paddingLarge: spacing.xxxl,
  },
  Button: {
    borderRadiusSmall: borderRadius.sm,
    borderRadiusMedium: borderRadius.md,
    borderRadiusLarge: borderRadius.lg,
    paddingSmall: `0 ${spacing.lg}`,
    paddingMedium: `0 ${spacing.xl}`,
    paddingLarge: `0 ${spacing.xxl}`,
  },
  Input: {
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    borderFocus: `1px solid ${colors.primary}`,
    borderHover: `1px solid ${colors.primaryHover}`,
  },
  Select: {
    borderRadius: borderRadius.md,
    peers: {
      InternalSelection: {
        borderRadius: borderRadius.md,
      },
    },
  },
  Layout: {
    color: colors.backgroundSecondary,
    siderColor: colors.background,
    headerColor: colors.background,
  },
  Menu: {
    borderRadius: borderRadius.md,
    itemColorActive: colors.primaryLight,
    itemTextColorActive: colors.primary,
    itemIconColorActive: colors.primary,
  },
  DataTable: {
    thColor: colors.backgroundSecondary,
    tdColor: colors.background,
    tdColorStriped: colors.backgroundSecondary,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
  },
  Statistic: {
    labelFontSize: fontSize.sm,
    labelTextColor: colors.textSecondary,
    valueFontSize: fontSize.xl,
    valueFontWeight: '600',
  },
} as const

export type ThemeOverrides = typeof themeOverrides
