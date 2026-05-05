'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { useAdminSocket } from '@/hooks/useSocket'
import { OrderDto, OrderStatus } from '@tableflow/types'
import { cn } from '@/lib/utils'
import { timeAgo, formatTime } from '@/lib/utils'
import { ChefHat, CheckCircle2, Clock, RefreshCw, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:   { label: 'New Order', bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-500',    text: 'text-red-700' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-amber-50',  border: 'border-amber-200', badge: 'bg-amber-500',  text: 'text-amber-700' },
  PREPARING: { label: 'Preparing', bg: 'bg-blue-50',   border: 'border-blue-200',  badge: 'bg-blue-500',   text: 'text-blue-700' },
  READY:     { label: 'Ready',     bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-500',  text: 'text-green-700' },
  SERVED:    { label: 'Served',    bg: 'bg-gray-50',   border: 'border-gray-200',  badge: 'bg-gray-400',   text: 'text-gray-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-50',   border: 'border-gray-200',  badge: 'bg-gray-400',   text: 'text-gray-500' },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
}

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Accept',
  CONFIRMED: 'Start Cooking',
  PREPARING: 'Mark Ready',
  READY: 'Mark Served',
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
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useAdminSocket({
    onOrderNew: ({ order }) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev
        toast('🍽️ New order: Table ' + order.tableCode, { icon: '🔔' })
        return [order, ...prev]
      })
    },
    onOrderUpdated: ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus } : o))
      )
    },
  })

  const handleStatusChange = async (order: OrderDto) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      const updated = await adminApi.updateOrderStatus(order.id, next)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      toast.success(`Order #${order.orderNumber} → ${next}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const activeStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']
  const displayOrders = filter === 'ALL'
    ? orders.filter((o) => activeStatuses.includes(o.status))
    : orders.filter((o) => o.status === filter)

  const counts = activeStatuses.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length
    return acc
  }, {})

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-500" />
            Kitchen Display
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time order management</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all', filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}
        >
          All Active ({Object.values(counts).reduce((s, v) => s + v, 0)})
        </button>
        {activeStatuses.map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                filter === s ? `${cfg.badge} text-white` : `bg-white ${cfg.text} border border-gray-200 hover:bg-gray-50`
              )}
            >
              {cfg.label} ({counts[s] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Order grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ChefHat className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No active orders</h3>
          <p className="text-sm text-gray-300 mt-1">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
              const next = NEXT_STATUS[order.status]
              return (
                <div
                  key={order.id}
                  className={cn(
                    'bg-white rounded-2xl border-2 shadow-card overflow-hidden transition-all',
                    cfg.border,
                    order.status === 'PENDING' && 'ring-2 ring-red-300 ring-offset-2'
                  )}
                >
                  {/* Card header */}
                  <div className={cn('px-4 py-3 flex items-center justify-between', cfg.bg)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-gray-900">{order.tableCode}</span>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full text-white', cfg.badge)}>
                          {cfg.label}
                        </span>
                        {order.status === 'PENDING' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Order #{order.orderNumber} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            <span className="text-orange-500 font-bold">{item.quantity}×</span> {item.menuItemName}
                          </p>
                          {item.options.length > 0 && (
                            <p className="text-xs text-gray-400">{item.options.map((o) => o.name).join(', ')}</p>
                          )}
                          {item.notes && <p className="text-xs text-orange-500 mt-0.5">📝 {item.notes}</p>}
                        </div>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="bg-yellow-50 rounded-lg px-3 py-2 mt-2">
                        <p className="text-xs text-yellow-700">📋 {order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {next && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleStatusChange(order)}
                        className={cn(
                          'w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95',
                          order.status === 'PENDING' ? 'bg-red-500 hover:bg-red-600' :
                          order.status === 'CONFIRMED' ? 'bg-amber-500 hover:bg-amber-600' :
                          order.status === 'PREPARING' ? 'bg-blue-500 hover:bg-blue-600' :
                          'bg-green-500 hover:bg-green-600'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                        {NEXT_ACTION_LABEL[order.status]}
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
