// 汇率数据（基准货币：CNY）
export const exchangeRates: Record<string, number> = {
  CNY: 1,
  HKD: 0.92,  // 1 HKD ≈ 0.92 CNY
  USD: 7.25,  // 1 USD ≈ 7.25 CNY
  GBP: 9.15,  // 1 GBP ≈ 9.15 CNY
  EUR: 7.85,
  JPY: 0.048
}

// 货币符号
export const currencySymbols: Record<string, string> = {
  CNY: '¥',
  HKD: 'HK$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥'
}

// 货币名称
export const currencyNames: Record<string, string> = {
  CNY: '人民币',
  HKD: '港币',
  USD: '美元',
  GBP: '英镑',
  EUR: '欧元',
  JPY: '日元'
}

/**
 * 将金额从源货币转换为目标货币
 * @param amount 金额
 * @param from 源货币
 * @param to 目标货币（默认为CNY）
 * @returns 转换后的金额
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string = 'CNY'
): number {
  if (from === to) return amount

  // 先转换为CNY（基准货币）
  const amountInCny = amount * exchangeRates[from]

  // 再从CNY转换为目标货币
  return amountInCny / exchangeRates[to]
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @param currency 货币代码
 * @param includeSymbol 是否包含货币符号
 * @returns 格式化后的字符串
 */
export function formatCurrency(
  amount: number,
  currency: string = 'CNY',
  includeSymbol: boolean = true
): string {
  const symbol = currencySymbols[currency] || currency
  const formatted = amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })

  if (includeSymbol) {
    return `${symbol}${formatted}`
  }
  return formatted
}

/**
 * 获取货币显示文本
 * @param amount 金额
 * @param currency 货币代码
 * @param baseCurrency 基准货币（用于换算显示）
 * @returns 显示文本
 */
export function formatAssetValue(
  amount: number,
  currency: string,
  baseCurrency: string = 'CNY'
): {
  original: string
  converted: string
  currency: string
} {
  const original = formatCurrency(amount, currency, true)

  if (currency !== baseCurrency) {
    const convertedAmount = convertCurrency(amount, currency, baseCurrency)
    const converted = formatCurrency(convertedAmount, baseCurrency, true)
    return {
      original,
      converted: `≈ ${converted}`,
      currency
    }
  }

  return {
    original,
    converted: '',
    currency
  }
}
