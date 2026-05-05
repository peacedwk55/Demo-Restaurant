import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'THB'): string {
  if (currency === 'THB') return `฿${amount.toLocaleString('th-TH')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เพิ่งสั่ง'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  return `${Math.floor(mins / 60)} ชม.ที่แล้ว`
}
