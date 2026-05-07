'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Grid3X3, Plus, Users, ArrowLeftRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { TableStatus } from '@tableflow/types'

const STATUS_OPTS: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'PAYMENT_PENDING', 'CLEANING']
const STATUS_CONFIG: Record<TableStatus, { label: string; color: string }> = {
  AVAILABLE:       { label: 'Available',  color: 'bg-emerald-100 text-emerald-700' },
  OCCUPIED:        { label: 'Occupied',   color: 'bg-orange-100 text-orange-700' },
  PAYMENT_PENDING: { label: 'Pay Pending',color: 'bg-red-100 text-red-700' },
  RESERVED:        { label: 'Reserved',   color: 'bg-blue-100 text-blue-700' },
  CLEANING:        { label: 'Cleaning',   color: 'bg-gray-100 text-gray-600' },
}

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelected, setSwapSelected] = useState<any[]>([])
  const [swapping, setSwapping] = useState(false)

  useEffect(() => {
    adminApi.getTables().then(setTables).finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    try {
      await adminApi.updateTableStatus(tableId, status)
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)))
      toast.success('Table status updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleSwapSelect = (table: any) => {
    if (swapSelected.find((t) => t.id === table.id)) {
      setSwapSelected((prev) => prev.filter((t) => t.id !== table.id))
      return
    }
    if (swapSelected.length >= 2) return
    setSwapSelected((prev) => [...prev, table])
  }

  const handleSwapConfirm = async () => {
    if (swapSelected.length !== 2) return
    setSwapping(true)
    try {
      await adminApi.swapTables(swapSelected[0].id, swapSelected[1].id)
      const [a, b] = swapSelected
      setTables((prev) => prev.map((t) => {
        if (t.id === a.id) return { ...t, status: b.status }
        if (t.id === b.id) return { ...t, status: a.status }
        return t
      }))
      toast.success(`สลับโต๊ะ ${a.code} ↔ ${b.code} เรียบร้อย`)
      setSwapMode(false)
      setSwapSelected([])
    } catch {
      toast.error('สลับโต๊ะไม่สำเร็จ')
    } finally {
      setSwapping(false)
    }
  }

  const byZone = tables.reduce<Record<string, any[]>>((acc, t) => {
    const z = t.zone ?? 'Main'
    if (!acc[z]) acc[z] = []
    acc[z].push(t)
    return acc
  }, {})

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-orange-500" />
            Tables
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{tables.length} tables total</p>
        </div>
        <div className="flex items-center gap-2">
          {swapMode ? (
            <>
              <span className="text-sm text-gray-500">
                {swapSelected.length === 0 && 'เลือกโต๊ะแรก'}
                {swapSelected.length === 1 && `เลือก ${swapSelected[0].code} → เลือกโต๊ะที่สอง`}
                {swapSelected.length === 2 && `สลับ ${swapSelected[0].code} ↔ ${swapSelected[1].code}`}
              </span>
              {swapSelected.length === 2 && (
                <button
                  onClick={handleSwapConfirm}
                  disabled={swapping}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {swapping ? 'กำลังสลับ...' : 'ยืนยันสลับ'}
                </button>
              )}
              <button
                onClick={() => { setSwapMode(false); setSwapSelected([]) }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <X className="w-4 h-4" />
                ยกเลิก
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSwapMode(true)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                สลับโต๊ะ
              </button>
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" />
                Add Table
              </button>
            </>
          )}
        </div>
      </div>

      {swapMode && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-sm text-orange-700">
          <strong>โหมดสลับโต๊ะ:</strong> คลิกเลือก 2 โต๊ะที่ต้องการสลับ ระบบจะย้ายออร์เดอร์และสถานะทั้งหมดให้อัตโนมัติ
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        Object.entries(byZone).map(([zone, zoneTables]) => (
          <div key={zone} className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{zone} Zone</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {zoneTables.map((table) => {
                const cfg = STATUS_CONFIG[table.status as TableStatus]
                const isSelected = swapSelected.find((t) => t.id === table.id)
                return (
                  <div
                    key={table.id}
                    onClick={() => swapMode && handleSwapSelect(table)}
                    className={cn(
                      'bg-white rounded-2xl p-4 border-2 shadow-card transition-all',
                      swapMode ? 'cursor-pointer hover:shadow-md' : '',
                      isSelected ? 'border-orange-500 bg-orange-50 scale-105 shadow-md shadow-orange-200' : 'border-gray-100',
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-extrabold text-gray-900">{table.code}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {table.capacity} seats
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                          {swapSelected.indexOf(swapSelected.find((t) => t.id === table.id)!) + 1}
                        </span>
                      ) : (
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    {!swapMode && (
                      <select
                        value={table.status}
                        onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-orange-400 text-gray-700"
                      >
                        {STATUS_OPTS.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
