'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { useAdminSocket } from '@/hooks/useSocket'
import { TableStatus, OrderDto } from '@tableflow/types'
import { cn } from '@/lib/utils'
import { formatPrice, timeAgo } from '@/lib/utils'
import { Grid3X3, CreditCard, X, CheckCircle2, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; bg: string; text: string; dot: string }> = {
  AVAILABLE:      { label: 'Available',      bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  OCCUPIED:       { label: 'Occupied',       bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400' },
  PAYMENT_PENDING:{ label: 'Pay Pending',    bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500' },
  RESERVED:       { label: 'Reserved',       bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400' },
  CLEANING:       { label: 'Cleaning',       bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
}

export default function CashierPage() {
  const [tables, setTables] = useState<any[]>([])
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [selectedTable, setSelectedTable] = useState<any | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)
  const [staffCalls, setStaffCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [t, o, c] = await Promise.all([
      adminApi.getTables(),
      adminApi.getOrders(),
      adminApi.getPendingCalls(),
    ])
    setTables(t)
    setOrders(o)
    setStaffCalls(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useAdminSocket({
    onOrderNew: ({ order }) => {
      setOrders((prev) => prev.find((o) => o.id === order.id) ? prev : [order, ...prev])
    },
    onOrderUpdated: ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: status as any } : null)
    },
    onTableUpdated: ({ tableId, status }) => {
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)))
    },
    onStaffCall: (payload) => {
      toast(`🔔 Table ${payload.tableCode}: ${payload.type}`, { duration: 6000 })
      setStaffCalls((prev) => [...prev, payload])
    },
    onPaymentRequested: (payload) => {
      toast(`💳 Table ${payload.tableCode} requests bill — ${formatPrice(payload.amount)}`, { duration: 8000, icon: '💳' })
    },
  })

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await adminApi.confirmPayment(orderId, 'CASH')
      setSelectedTable(null)
      setSelectedOrder(null)
      await fetchAll()
      toast.success('Payment confirmed!')
    } catch {
      toast.error('Failed to confirm payment')
    }
  }

  const handleClearTable = async (tableId: string) => {
    try {
      await adminApi.clearTable(tableId)
      setSelectedTable(null)
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: 'AVAILABLE' } : t)))
      toast.success('Table cleared')
    } catch {
      toast.error('Failed to clear table')
    }
  }

  const handleResolveCall = async (callId: string) => {
    try {
      await adminApi.resolveCall(callId)
      setStaffCalls((prev) => prev.filter((c) => c.callId !== callId && c.id !== callId))
      toast.success('Call resolved')
    } catch {}
  }

  const getTableOrders = (tableId: string) =>
    orders.filter((o) => o.tableId === tableId && o.status !== 'SERVED' && o.status !== 'CANCELLED')

  const zones = [...new Set(tables.map((t) => t.zone ?? 'Main'))]

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-500" />
            Cashier
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Table map & payment management</p>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(TABLE_STATUS_CONFIG).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={cn('w-2 h-2 rounded-full', v.dot)} />
              {v.label}
            </div>
          ))}
        </div>
      </div>

      {/* Staff calls alert */}
      {staffCalls.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">{staffCalls.length} Staff Call(s)</h3>
          </div>
          <div className="space-y-2">
            {staffCalls.map((call, i) => (
              <div key={call.callId ?? i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{call.type === 'PAYMENT' ? '💳' : call.type === 'WATER' ? '💧' : '🙋'}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Table {call.tableCode} — {call.type}</p>
                    {call.message && <p className="text-xs text-gray-500">{call.message}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleResolveCall(call.callId ?? call.id)}
                  className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg font-medium"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table grid by zone */}
      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        zones.map((zone) => (
          <div key={zone} className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{zone}</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {tables
                .filter((t) => (t.zone ?? 'Main') === zone)
                .map((table) => {
                  const cfg = TABLE_STATUS_CONFIG[table.status as TableStatus] ?? TABLE_STATUS_CONFIG.AVAILABLE
                  const tableOrders = getTableOrders(table.id)
                  const hasPaymentPending = table.status === 'PAYMENT_PENDING'
                  return (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table)
                        setSelectedOrder(tableOrders[0] ?? null)
                      }}
                      className={cn(
                        'p-3 rounded-2xl border-2 text-left transition-all hover:shadow-md active:scale-95',
                        cfg.bg,
                        hasPaymentPending ? 'border-red-300' : 'border-transparent',
                        hasPaymentPending && 'ring-2 ring-red-200'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full mb-2', cfg.dot)} />
                      <p className="text-sm font-bold text-gray-900">{table.code}</p>
                      <p className={cn('text-xs font-medium mt-0.5', cfg.text)}>{cfg.label}</p>
                      {tableOrders.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{tableOrders.length} order{tableOrders.length > 1 ? 's' : ''}</p>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        ))
      )}

      {/* Table detail panel */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedTable(null)} />
          <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTable.name}</h2>
                <p className="text-sm text-gray-500">{TABLE_STATUS_CONFIG[selectedTable.status as TableStatus]?.label}</p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Order detail */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {selectedOrder ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Order #{selectedOrder.orderNumber}</p>
                      <p className="text-xs text-gray-400">{timeAgo(selectedOrder.createdAt)}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', {
                      'bg-red-100 text-red-700': selectedOrder.status === 'PENDING',
                      'bg-amber-100 text-amber-700': selectedOrder.status === 'CONFIRMED',
                      'bg-blue-100 text-blue-700': selectedOrder.status === 'PREPARING',
                      'bg-green-100 text-green-700': selectedOrder.status === 'READY',
                      'bg-orange-100 text-orange-700': selectedOrder.status === 'SERVED',
                    })}>
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">{item.quantity}× {item.menuItemName}</span>
                          {item.options.length > 0 && (
                            <p className="text-xs text-gray-400">{item.options.map((o) => o.name).join(', ')}</p>
                          )}
                        </div>
                        <span className="text-gray-700 font-medium flex-shrink-0 ml-2">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-orange-500">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No active orders</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-2">
              {selectedOrder && (
                <button
                  onClick={() => handleConfirmPayment(selectedOrder.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Payment · {formatPrice(selectedOrder.totalAmount)}
                </button>
              )}
              <button
                onClick={() => handleClearTable(selectedTable.id)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium text-sm transition-all"
              >
                Clear Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
