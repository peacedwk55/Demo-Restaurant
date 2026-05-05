import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'THB'): string {
  if (currency === 'THB') return `฿${amount.toLocaleString('th-TH')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function generateSessionCode(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
