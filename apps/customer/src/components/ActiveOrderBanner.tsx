'use client'
import { useCartStore } from '@/store/cart.store'
import Link from 'next/link'
import { ClipboardList, CreditCard, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  tenant: string
  table: string
  tableId: string
  apiOrderId?: string | null  // active order from server (cashier-placed orders)
}

export default function ActiveOrderBanner({ tenant, table, tableId, apiOrderId }: Props) {
  const { activeOrderId, tableId: storeTableId, setActiveOrder } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // ก่อน hydrate ให้ใช้ apiOrderId (server data) อย่างเดียว
  if (!mounted) {
    if (!apiOrderId) return null
    return <BannerUI tenant={tenant} table={table} orderId={apiOrderId} onDismiss={() => {}} />
  }

  // ใช้ localStorage ก่อน (ออร์เดอร์ของลูกค้าเอง) ถ้าไม่มีใช้จาก API (cashier สั่งแทน)
  const localOrderId = storeTableId === tableId ? activeOrderId : null
  const orderId = localOrderId ?? apiOrderId ?? null

  if (!orderId) return null

  return <BannerUI tenant={tenant} table={table} orderId={orderId} onDismiss={() => setActiveOrder(null)} />
}

function BannerUI({ tenant, table, orderId, onDismiss }: { tenant: string; table: string; orderId: string; onDismiss: () => void }) {
  return (
    <div className="mx-5 mt-4 rounded-3xl overflow-hidden border border-orange-200 shadow-sm">
      <div className="flex items-center justify-between bg-orange-500 px-4 py-2.5">
        <p className="text-white text-xs font-bold">🍽️ คุณมีออร์เดอร์ที่กำลังดำเนินการอยู่</p>
        <button onClick={onDismiss} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <div className="bg-orange-50 p-3 space-y-2">
        <Link href={`/${tenant}/${table}/order/${orderId}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-orange-100 active:scale-95 transition-transform">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-stone-900">ติดตามออร์เดอร์</p>
            <p className="text-xs text-stone-500">ดูสถานะ · สั่งเพิ่ม · เรียกพนักงาน</p>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </Link>
        <Link href={`/${tenant}/${table}/payment/${orderId}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-orange-100 active:scale-95 transition-transform">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-stone-900">ชำระเงิน</p>
            <p className="text-xs text-stone-500">PromptPay หรือเงินสด</p>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </Link>
      </div>
    </div>
  )
}
