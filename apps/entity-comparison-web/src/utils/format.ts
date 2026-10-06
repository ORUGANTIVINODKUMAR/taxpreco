const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
export const money = (value: number) => currency.format(value)
export const benefit = (value: number) =>
  `${value < 0 ? '−' : '+'}${money(Math.abs(value))}`
