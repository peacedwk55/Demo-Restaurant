'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useOrderSocket } from '@/hooks/useSocket'
import { OrderDto, OrderStatus } from '@tableflow/types'
import { formatPrice } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useCartStore } from '@/store/cart.store'

const DOTS = [
  { label: 'ส่งออร์เดอร์แล้ว', sublabel: 'รอครัวรับออร์เดอร์', emoji: '📋', lit: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
  { label: 'ครัวรับแล้ว',      sublabel: 'กำลังเตรียมอาหาร',  emoji: '👨‍🍳', lit: ['CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
  { label: 'พร้อมเสิร์ฟ',     sublabel: 'อาหารมาแล้ว! 🎉',   emoji: '🍽️', lit: ['READY', 'SERVED'] },
]

const getCurrentDotIdx = (status: OrderStatus) => {
  if (['READY', 'SERVED'].includes(status)) return 2
  if (['CONFIRMED', 'PREPARING'].includes(status)) return 1
  return 0
}

export default function OrderStatusPage() {
  const params = useParams<{ tenant: string; table: string; orderId: string }>()
  const router = useRouter()
  const { setActiveOrder } = useCartStore()
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      const o = await api.getOrder(params.tenant, params.orderId)
      setOrder(o)
    } catch {
      toast.error('ไม่พบออร์เดอร์')
    } finally {
      setLoading(false)
    }
  }, [params.tenant, params.orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  useOrderSocket({
    orderId: params.orderId,
    tenantId: order?.tenantId ?? '',
    tableId: order?.tableId ?? '',
    onOrderUpdated: ({ orderId, status }) => {
      if (orderId === params.orderId) {
        setOrder((prev) => prev ? { ...prev, status: status as OrderStatus } : prev)
        if (status === 'SERVED') {
          toast.success('อาหารเสิร์ฟแล้ว! รับประทานให้อร่อยนะคะ 🍽️', { duration: 5000 })
        }
      }
    },
    onPaymentConfirmed: ({ orderId }) => {
      if (orderId === params.orderId) {
        setActiveOrder(null)
        toast.success('ชำระเงินเรียบร้อย! ขอบคุณที่ใช้บริการ 🙏', { duration: 4000 })
        setTimeout(() => router.push(`/${params.tenant}/${params.table}`), 2000)
      }
    },
  })

  const handleCallStaff = async (type: 'ASSISTANCE' | 'PAYMENT' | 'WATER') => {
    try {
      await api.callStaff(params.tenant, params.orderId, type)
      const labels = { ASSISTANCE: 'เรียกพนักงานแล้ว', PAYMENT: 'แจ้งขอเก็บเงินแล้ว', WATER: 'ขอน้ำแล้ว' }
      toast.success(labels[type])
    } catch {
      toast.error('ไม่สามารถส่งสัญญาณได้')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-stone-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const currentDotIdx = getCurrentDotIdx(order.status)
  const currentDot = DOTS[currentDotIdx]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-orange-500 px-6 pt-10 pb-8 text-white">
        <p className="text-orange-200 text-sm">ออร์เดอร์ #{order.orderNumber}</p>
        <h1 className="text-2xl font-bold mt-1">{currentDot.label}</h1>
        <p className="text-orange-100 text-sm mt-1 animate-pulse">{currentDot.sublabel}</p>
      </div>

      {/* 3-dot progress */}
      <div className="mx-4 -mt-5 bg-white rounded-3xl p-6 shadow-card border border-stone-100">
        <div className="flex items-start justify-between">
          {DOTS.map((dot, i) => {
            const isLit = (dot.lit as string[]).includes(order.status)
            const isCurrent = i === currentDotIdx
            const isLast = i === DOTS.length - 1
            return (
              <div key={i} className="flex items-center flex-1">
                {/* Dot + label */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-500',
                    isLit
                      ? 'bg-orange-500 shadow-lg shadow-orange-300'
                      : 'bg-stone-100',
                    isCurrent && 'ring-4 ring-orange-100 scale-110',
                  )}>
                    <span className={cn('transition-all', isLit ? 'grayscale-0' : 'grayscale opacity-40')}>
                      {dot.emoji}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs font-bold text-center leading-tight max-w-[72px]',
                    isLit ? 'text-stone-900' : 'text-stone-300',
                  )}>
                    {dot.label}
                  </p>
                </div>
                {/* Connecting line (not after last dot) */}
                {!isLast && (
                  <div className="flex-1 mx-2 mb-6">
                    <div className="h-0.5 bg-stone-200 relative overflow-hidden rounded-full">
                      <div
                        className="absolute inset-y-0 left-0 bg-orange-400 transition-all duration-700"
                        style={{ width: (DOTS[i + 1].lit as string[]).includes(order.status) ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card border border-stone-100">
        <h2 className="text-sm font-bold text-stone-800 mb-3">รายการอาหาร</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-stone-800">{item.menuItemName}</span>
                <span className="text-stone-400"> ×{item.quantity}</span>
                {item.options.length > 0 && (
                  <p className="text-xs text-stone-400">{item.options.map((o) => o.name).join(', ')}</p>
                )}
              </div>
              <span className="font-semibold text-stone-700">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between">
          <span className="font-bold text-stone-900">รวม</span>
          <span className="font-bold text-orange-500">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-4 space-y-3">
        {/* Order more */}
        <Link
          href={`/${params.tenant}/${params.table}/menu`}
          className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-card border border-stone-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">สั่งเพิ่ม</p>
              <p className="text-xs text-stone-400">เพิ่มรายการอาหาร</p>
            </div>
          </div>
          <span className="text-stone-300">›</span>
        </Link>

        {/* Call staff buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
          <p className="text-sm font-bold text-stone-800 mb-3">เรียกพนักงาน</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'ASSISTANCE' as const, icon: '🙋', label: 'ขอความช่วยเหลือ' },
              { type: 'PAYMENT' as const, icon: '💳', label: 'เรียกเก็บเงิน' },
            ].map((action) => (
              <button
                key={action.type}
                onClick={() => handleCallStaff(action.type)}
                className="flex flex-col items-center gap-1 bg-stone-50 hover:bg-stone-100 active:scale-95 transition-all p-3 rounded-xl"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-stone-600 font-medium text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pay button */}
        {(order.status === 'SERVED' || order.status === 'READY') && (
          <Link
            href={`/${params.tenant}/${params.table}/payment/${params.orderId}`}
            className="block w-full bg-orange-500 text-white text-center py-4 rounded-2xl font-bold shadow-brand active:scale-95 transition-transform"
          >
            ชำระเงิน
          </Link>
        )}
      </div>

      <div className="h-8" />
    </div>
  )
}
