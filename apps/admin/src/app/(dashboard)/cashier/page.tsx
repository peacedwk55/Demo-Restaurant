'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { useAdminSocket } from '@/hooks/useSocket'
import { TableStatus, OrderDto } from '@tableflow/types'
import { cn } from '@/lib/utils'
import { formatPrice, timeAgo } from '@/lib/utils'
import { CreditCard, X, CheckCircle2, Bell, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { sounds } from '@/lib/sound'

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; cardBg: string; cardBorder: string; dot: string; textColor: string }> = {
  AVAILABLE:       { label: 'ว่าง',           cardBg: 'bg-white',      cardBorder: 'border-gray-200',   dot: 'bg-emerald-400', textColor: 'text-emerald-600' },
  OCCUPIED:        { label: 'มีลูกค้า',       cardBg: 'bg-orange-50',  cardBorder: 'border-orange-200', dot: 'bg-orange-400',  textColor: 'text-orange-600'  },
  PAYMENT_PENDING: { label: 'รอชำระเงิน',     cardBg: 'bg-red-50',     cardBorder: 'border-red-300',    dot: 'bg-red-500',     textColor: 'text-red-600'     },
  RESERVED:        { label: 'จอง',            cardBg: 'bg-blue-50',    cardBorder: 'border-blue-200',   dot: 'bg-blue-400',    textColor: 'text-blue-600'    },
  CLEANING:        { label: 'ทำความสะอาด',   cardBg: 'bg-gray-50',    cardBorder: 'border-gray-200',   dot: 'bg-gray-400',    textColor: 'text-gray-500'    },
}

const STATUS_ORDER_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served',
}
const STATUS_ORDER_COLOR: Record<string, string> = {
  PENDING: 'bg-red-100 text-red-700', CONFIRMED: 'bg-amber-100 text-amber-700',
  PREPARING: 'bg-blue-100 text-blue-700', READY: 'bg-emerald-100 text-emerald-700', SERVED: 'bg-gray-100 text-gray-600',
}

export default function CashierPage() {
  const [tables, setTables] = useState<any[]>([])
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [selectedTable, setSelectedTable] = useState<any | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)
  const [staffCalls, setStaffCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [t, o, c] = await Promise.all([adminApi.getTables(), adminApi.getOrders(), adminApi.getPendingCalls()])
    setTables(t); setOrders(o); setStaffCalls(c); setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useAdminSocket({
    onOrderNew: ({ order }) => setOrders((prev) => prev.find((o) => o.id === order.id) ? prev : [order, ...prev]),
    onOrderUpdated: ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: status as any } : null)
    },
    onTableUpdated: ({ tableId, status }) => setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status } : t)),
    onStaffCall: (payload) => {
      sounds.staffCall(payload.tableCode, payload.type)
      const callLabel: Record<string, string> = { PAYMENT: 'Requesting bill', WATER: 'Requesting water', ASSISTANCE: 'Needs assistance' }
      toast(`🔔 Table ${payload.tableCode}: ${callLabel[payload.type] ?? payload.type}`, { duration: 6000 })
      setStaffCalls((prev) => [...prev, payload])
    },
    onPaymentRequested: (payload) => {
      sounds.paymentRequested(payload.tableCode)
      toast(`💳 Table ${payload.tableCode} requesting payment — ${formatPrice(payload.amount)}`, { duration: 8000, icon: '💳' })
    },
    onPaymentConfirmed: ({ orderId }) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === orderId)
        if (order) sounds.paymentConfirmed(order.tableCode, Number(order.totalAmount))
        return prev
      })
    },
  })

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await adminApi.confirmPayment(orderId, 'CASH')
      setSelectedTable(null); setSelectedOrder(null)
      await fetchAll()
      toast.success('Payment confirmed!')
    } catch { toast.error('Failed to confirm payment') }
  }

  const handleClearTable = async (tableId: string) => {
    try {
      await adminApi.clearTable(tableId)
      setSelectedTable(null)
      setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: 'AVAILABLE' } : t))
      toast.success('Table cleared')
    } catch { toast.error('Failed to clear table') }
  }

  const handleResolveCall = async (callId: string) => {
    try {
      await adminApi.resolveCall(callId)
      setStaffCalls((prev) => prev.filter((c) => c.callId !== callId && c.id !== callId))
    } catch {}
  }

  const getTableOrders = (tableId: string) =>
    orders.filter((o) => o.tableId === tableId && o.status !== 'SERVED' && o.status !== 'CANCELLED')

  const zones = [...new Set(tables.map((t) => t.zone ?? 'Main'))]

  const paymentPendingCount = tables.filter((t) => t.status === 'PAYMENT_PENDING').length
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Cashier</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              มีลูกค้า {occupiedCount} โต๊ะ · รอชำระเงิน {paymentPendingCount} โต๊ะ
            </p>
          </div>
        </div>
        {/* Legend */}
        <div className="hidden md:flex items-center gap-4">
          {Object.entries(TABLE_STATUS_CONFIG).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', v.dot)} />
              <span className="text-xs text-gray-500">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff calls */}
      {staffCalls.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800">Staff Calls ({staffCalls.length})</span>
          </div>
          <div className="p-3 space-y-2">
            {staffCalls.map((call, i) => (
              <div key={call.callId ?? i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{call.type === 'PAYMENT' ? '💳' : call.type === 'WATER' ? '💧' : '🙋'}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Table {call.tableCode}</p>
                    <p className="text-xs text-gray-500">
                      {call.type === 'PAYMENT' ? 'Requesting bill' : call.type === 'WATER' ? 'Requesting water' : 'Needs assistance'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleResolveCall(call.callId ?? call.id)}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table grid */}
      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        zones.map((zone) => (
          <div key={zone} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zone {zone}</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {tables
                .filter((t) => (t.zone ?? 'Main') === zone)
                .map((table) => {
                  const cfg = TABLE_STATUS_CONFIG[table.status as TableStatus] ?? TABLE_STATUS_CONFIG.AVAILABLE
                  const tableOrders = getTableOrders(table.id)
                  const isPending = table.status === 'PAYMENT_PENDING'
                  const tableOrder = tableOrders[0]
                  return (
                    <button
                      key={table.id}
                      onClick={() => { setSelectedTable(table); setSelectedOrder(tableOrders[0] ?? null) }}
                      className={cn(
                        'relative p-3 rounded-2xl border-2 text-left transition-all hover:shadow-md active:scale-95 group',
                        cfg.cardBg, cfg.cardBorder,
                        isPending && 'ring-2 ring-red-300 ring-offset-1'
                      )}
                    >
                      {isPending && (
                        <AlertCircle className="absolute top-2 right-2 w-3.5 h-3.5 text-red-500 animate-pulse" />
                      )}
                      <div className={cn('w-2 h-2 rounded-full mb-2', cfg.dot)} />
                      <p className="text-base font-extrabold text-gray-900 leading-none">{table.code}</p>
                      <p className={cn('text-[11px] font-semibold mt-1', cfg.textColor)}>{cfg.label}</p>
                      {tableOrders.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {tableOrders.length} order{tableOrders.length > 1 ? 's' : ''}
                          {tableOrder && ` · ${formatPrice(tableOrder.totalAmount)}`}
                        </p>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        ))
      )}

      {/* Side panel */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTable(null)} />
          <div className="relative bg-white w-full max-w-sm shadow-2xl flex flex-col h-full animate-slide-in">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-extrabold text-gray-900">{selectedTable.name}</span>
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full',
                      TABLE_STATUS_CONFIG[selectedTable.status as TableStatus]?.textColor,
                      TABLE_STATUS_CONFIG[selectedTable.status as TableStatus]?.cardBg,
                    )}>
                      {TABLE_STATUS_CONFIG[selectedTable.status as TableStatus]?.label}
                    </span>
                  </div>
                  {selectedTable.zone && (
                    <p className="text-xs text-gray-400 mt-0.5">Zone {selectedTable.zone}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Order detail */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedOrder ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{selectedOrder.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(selectedOrder.createdAt)}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', STATUS_ORDER_COLOR[selectedOrder.status] ?? 'bg-gray-100 text-gray-600')}>
                      {STATUS_ORDER_LABEL[selectedOrder.status] ?? selectedOrder.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 bg-gray-900 text-white text-xs font-extrabold rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{item.menuItemName}</p>
                            {item.options.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">{item.options.map((o) => o.name).join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 flex-shrink-0">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-base border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-orange-500 text-lg">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <CreditCard className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">No active orders</p>
                  <p className="text-xs text-gray-300 mt-1">Table is available</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
              {selectedOrder && (
                <button
                  onClick={() => handleConfirmPayment(selectedOrder.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Payment · {formatPrice(selectedOrder.totalAmount)}
                </button>
              )}
              <button
                onClick={() => handleClearTable(selectedTable.id)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm transition-all"
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
