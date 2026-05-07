'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { useAdminSocket } from '@/hooks/useSocket'
import { OrderDto, OrderStatus } from '@tableflow/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'
import { ChefHat, RefreshCw, Clock, CheckCircle2, Flame, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { sounds } from '@/lib/sound'

const STATUS_CONFIG = {
  PENDING:   { label: 'ออร์เดอร์ใหม่', labelEn: 'New',       headerBg: 'bg-red-500',    cardBorder: 'border-red-200',   cardBg: 'bg-red-50',   badge: 'bg-red-500',   ring: 'ring-red-300' },
  CONFIRMED: { label: 'ยืนยันแล้ว',    labelEn: 'Confirmed', headerBg: 'bg-amber-500',  cardBorder: 'border-amber-200', cardBg: 'bg-amber-50', badge: 'bg-amber-500', ring: '' },
  PREPARING: { label: 'กำลังทำอาหาร', labelEn: 'Preparing', headerBg: 'bg-blue-500',   cardBorder: 'border-blue-200',  cardBg: 'bg-blue-50',  badge: 'bg-blue-500',  ring: '' },
  READY:     { label: 'พร้อมเสิร์ฟ',  labelEn: 'Ready',     headerBg: 'bg-emerald-500',cardBorder: 'border-emerald-200',cardBg:'bg-emerald-50',badge:'bg-emerald-500',ring: '' },
  SERVED:    { label: 'เสิร์ฟแล้ว',   labelEn: 'Served',    headerBg: 'bg-gray-400',   cardBorder: 'border-gray-200',  cardBg: 'bg-gray-50',  badge: 'bg-gray-400',  ring: '' },
  CANCELLED: { label: 'ยกเลิก',       labelEn: 'Cancelled', headerBg: 'bg-gray-400',   cardBorder: 'border-gray-200',  cardBg: 'bg-gray-50',  badge: 'bg-gray-400',  ring: '' },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'READY',
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; icon: React.ElementType; color: string }>> = {
  PENDING:   { label: 'รับออร์เดอร์', icon: CheckCircle2, color: 'bg-red-500 hover:bg-red-600' },
  CONFIRMED: { label: 'พร้อมเสิร์ฟ', icon: Zap,          color: 'bg-emerald-500 hover:bg-emerald-600' },
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    }, 30000)
    return () => clearInterval(id)
  }, [createdAt])

  const isUrgent = elapsed >= 15
  const isWarning = elapsed >= 8

  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
      isUrgent ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
    )}>
      <Clock className="w-3 h-3" />
      {elapsed < 1 ? '<1 นาที' : `${elapsed} นาที`}
    </div>
  )
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const fetchOrders = useCallback(async () => {
    try {
      const data = await adminApi.getOrders()
      setOrders(data)
    } catch {
      toast.error('โหลดออร์เดอร์ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useAdminSocket({
    onOrderNew: ({ order }) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev
        sounds.orderNew(order.tableCode, order.items.length)
        toast(`โต๊ะ ${order.tableCode} สั่งอาหาร!`, { icon: '🔔', duration: 5000 })
        return [order, ...prev]
      })
    },
    onOrderUpdated: ({ orderId, status }) => {
      setOrders((prev) => {
        const updated = prev.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus } : o))
        if (status === 'READY') {
          const order = updated.find((o) => o.id === orderId)
          if (order) sounds.foodReady(order.tableCode)
        }
        return updated
      })
    },
    onPaymentConfirmed: ({ orderId }) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    },
  })

  const handleStatusChange = async (order: OrderDto) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      const updated = await adminApi.updateOrderStatus(order.id, next)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      toast.success(`#${order.orderNumber} → ${STATUS_CONFIG[next]?.label}`)
    } catch {
      toast.error('อัปเดตสถานะไม่สำเร็จ')
    }
  }

  const activeStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'READY']
  const displayOrders = filter === 'ALL'
    ? orders.filter((o) => activeStatuses.includes(o.status))
    : orders.filter((o) => o.status === filter)

  const counts = activeStatuses.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length
    return acc
  }, {})

  const totalActive = Object.values(counts).reduce((s, v) => s + v, 0)

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Kitchen Display</h1>
            <p className="text-xs text-gray-400 mt-0.5">{totalActive} ออร์เดอร์ที่ต้องดำเนินการ</p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border',
            filter === 'ALL'
              ? 'bg-gray-900 text-white border-transparent shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          )}
        >
          ทั้งหมด ({totalActive})
        </button>
        {activeStatuses.map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex items-center gap-1.5',
                filter === s
                  ? `${cfg.badge} text-white border-transparent shadow-sm`
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', filter === s ? 'bg-white' : cfg.badge)} />
              {cfg.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                filter === s ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
              )}>
                {counts[s] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
            <ChefHat className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-400">ไม่มีออร์เดอร์</h3>
          <p className="text-sm text-gray-300 mt-1">ออร์เดอร์ใหม่จะแสดงที่นี่แบบ real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
              const action = NEXT_ACTION[order.status]
              const ActionIcon = action?.icon ?? CheckCircle2
              return (
                <div
                  key={order.id}
                  className={cn(
                    'bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                    cfg.cardBorder,
                    order.status === 'PENDING' && 'shadow-red-100 shadow-md'
                  )}
                >
                  {/* Card header */}
                  <div className={cn('px-4 py-3 flex items-center justify-between', cfg.cardBg)}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                            โต๊ะ {order.tableCode}
                          </span>
                          {order.status === 'PENDING' && (
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">ออร์เดอร์ #{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ElapsedTimer createdAt={order.createdAt} />
                      <span className={cn('text-[10px] font-bold text-white px-2 py-0.5 rounded-full', cfg.badge)}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className="w-6 h-6 bg-orange-500 text-white text-xs font-extrabold rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.quantity}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{item.menuItemName}</p>
                          {item.options.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.options.map((o) => o.name).join(' · ')}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-orange-600 mt-0.5 font-medium">📝 {item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 mt-1">
                        <p className="text-xs text-yellow-700 font-medium">📋 {order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {action && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleStatusChange(order)}
                        className={cn(
                          'w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2',
                          action.color
                        )}
                      >
                        <ActionIcon className="w-4 h-4" />
                        {action.label}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
