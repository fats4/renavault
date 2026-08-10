const rupiahFormatter = new Intl.NumberFormat('id-ID')

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatRupiahInput(value: number | string): string {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : parseInputNumber(String(value))
  if (num === 0 && String(value).replace(/\D/g, '') === '') return ''
  return rupiahFormatter.format(num)
}

export function parseInputNumber(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (digits === '') return 0
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}
