import type { ReactNode } from 'react'
import { formatRupiahInput } from '../../lib/format'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-surface-700 bg-surface-850 p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-surface-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
}

export function StatCard({ label, value, change, trend = 'neutral', icon }: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-positive' : trend === 'down' ? 'text-negative' : 'text-surface-500'

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</p>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold text-white">{value}</p>
      {change && <p className={`mt-1 text-xs ${trendColor}`}>{change}</p>}
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const colors = {
    default: 'bg-surface-700 text-surface-300',
    success: 'bg-positive/15 text-positive',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-negative/15 text-negative',
    info: 'bg-info/15 text-info',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = '',
}: ButtonProps) {
  const variants = {
    primary: 'bg-accent text-surface-950 hover:bg-accent-light',
    secondary: 'border border-surface-600 bg-surface-800 text-white hover:bg-surface-700',
    ghost: 'text-surface-400 hover:bg-surface-800 hover:text-white',
    danger: 'bg-negative/15 text-negative hover:bg-negative/25',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

interface InputProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  prefix?: string
  inputClassName?: string
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  prefix,
  inputClassName = '',
}: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-surface-400">{label}</span>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${prefix ? 'pl-8' : ''} ${inputClassName}`}
        />
      </div>
    </label>
  )
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-surface-400">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

interface RupiahInputProps {
  label?: string
  value: string | number
  onChange: (formatted: string) => void
  onValueChange?: (amount: number) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function RupiahInput({
  label,
  value,
  onChange,
  onValueChange,
  placeholder = '0',
  className = '',
  inputClassName = '',
}: RupiahInputProps) {
  const display =
    typeof value === 'number'
      ? formatRupiahInput(value)
      : value === ''
        ? ''
        : formatRupiahInput(value)

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (digits === '') {
      onChange('')
      onValueChange?.(0)
      return
    }
    const num = Number(digits)
    const formatted = formatRupiahInput(num)
    onChange(formatted)
    onValueChange?.(num)
  }

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-medium text-surface-400">{label}</span>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-surface-600 bg-surface-800 py-2 pl-8 pr-3 font-mono text-sm text-white placeholder:text-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${inputClassName}`}
        />
      </div>
    </label>
  )
}
