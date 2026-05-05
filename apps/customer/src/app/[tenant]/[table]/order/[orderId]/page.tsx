'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useOrderSocket } from '@/hooks/useSocket'
import { OrderDto, OrderStatus } from '@tableflow/types'
import { formatPrice } from '@/lib/utils'
import { CheckCircle2, Clock, ChefHat, Truck, Plus, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STATUS_STEPS: { status: OrderStatus; label: string; sublabel: string; icon: React.ElementType }[] = [
  { status: 'PENDING', label: 'รับออร์เดอร์แล้ว', sublabel: 'ทีมครัวกำลังรับออร์เดอร์', icon: CheckCircle2 },
  { status: 'CONFIRMED', label: 'ยืนยันออร์เดอร์', sublabel: 'ยืนยันแล้ว เตรียมทำอาหาร', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'กำลังเตรียมอาหาร', sublabel: 'ครัวกำลังทำอาหารให้คุณ', icon: ChefHat },
  { status: 'READY', label: 'อาหารพร้อมแล้ว', sublabel: 'พนักงานกำลังนำอาหารมาให้', icon: Truck },
  { status: 'SERVED', label: 'เสิร์ฟแล้ว', sublabel: 'รับประทานอาหารให้อร่อยนะคะ 🙏', icon: CheckCircle2 },
]

const STATUS_ORDER: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']

export default function OrderStatusPage() {
  const params = useParams<{ tenant: string; table: string; orderId: string }>()
  const router = useRouter()
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
    tenantId: order?.tableId ? params.tenant : '',
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
        router.push(`/${params.tenant}/${params.table}/review/${params.orderId}`)
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

  const currentStepIdx = STATUS_ORDER.indexOf(order.status)
  const currentStep = STATUS_STEPS.find((s) => s.status === order.status) ?? STATUS_STEPS[0]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-orange-500 px-6 pt-10 pb-6 text-white">
        <p className="text-orange-200 text-sm">ออร์เดอร์ #{order.orderNumber}</p>
        <h1 className="text-2xl font-bold mt-1">{currentStep.label}</h1>
        <p className="text-orange-100 text-sm mt-1">{currentStep.sublabel}</p>
      </div>

      {/* Progress stepper */}
      <div className="mx-4 -mt-3 bg-white rounded-2xl p-5 shadow-card border border-stone-100">
        <div className="relative">
          {/* Track */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-stone-200" />
          <div
            className="absolute left-4 top-4 w-0.5 bg-orange-500 transition-all duration-700"
            style={{ height: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          <div className="space-y-6">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < currentStepIdx
              const isCurrent = i === currentStepIdx
              const Icon = step.icon
              return (
                <div key={step.status} className="flex items-center gap-4 relative">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all',
                      isDone && 'bg-orange-500',
                      isCurrent && 'bg-orange-500 ring-4 ring-orange-100',
                      !isDone && !isCurrent && 'bg-white border-2 border-stone-200'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-white fill-current" />
                    ) : isCurrent ? (
                      <Icon className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-stone-200" />
                    )}
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', isDone || isCurrent ? 'text-stone-900' : 'text-stone-400')}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-orange-500 font-medium animate-pulse">{step.sublabel}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
              { type: 'WATER' as const, icon: '💧', label: 'ขอน้ำ' },
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
