const CURRENCY_CONFIG = {
  INR: { symbol: '₹', locale: 'en-IN' },
  MYR: { symbol: 'RM', locale: 'en-MY' },
  SGD: { symbol: 'S$', locale: 'en-SG' },
  AED: { symbol: 'AED ', locale: 'en-AE' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  LKR: { symbol: 'Rs.', locale: 'en-LK' },
}

export function formatMoney(amount, currency = 'INR') {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR
  const formatted = Number(amount || 0).toLocaleString(config.locale)
  return `${config.symbol}${formatted}`
}