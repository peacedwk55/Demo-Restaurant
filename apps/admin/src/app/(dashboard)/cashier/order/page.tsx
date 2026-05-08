'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Plus, Minus, ShoppingBag, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface CartItem {
  menuItemId: string
  menuItemName: string
  unitPrice: number
  quantity: number
}

export default function CashierOrderPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()
  const [tables, setTables] = useState<any[]>([])
  const [selectedTableId, setSelectedTableId] = useState('')
  const [menu, setMenu] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    adminApi.getTables().then((t: any[]) => {
      setTables(t)
      if (t.length > 0) setSelectedTableId(t[0].id)
    })
  }, [])

  useEffect(() => {
    if (!tenant?.slug) return
    fetch(`${BASE}/api/public/${tenant.slug}/menu`)
      .then((r) => r.json())
      .then((data) => {
        setMenu(data)
        if (data.categories?.length > 0) setActiveCategory(data.categories[0].id)
      })
      .catch(() => toast.error('โหลดเมนูไม่สำเร็จ'))
  }, [tenant?.slug])

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItemId: item.id, menuItemName: item.name, unitPrice: Number(item.price), quantity: 1 }]
    })
  }

  const updateQty = (menuItemId: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0))
  }

  const total = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  const selectedTable = tables.find((t) => t.id === selectedTableId)

  // menu.items is a flat array — filter by categoryId
  const activeItems = (menu?.items ?? []).filter((i: any) => i.categoryId === activeCategory && i.isAvailable)

  const handlePlaceOrder = async () => {
    if (!selectedTableId) return toast.error('กรุณาเลือกโต๊ะ')
    if (cart.length === 0) return toast.error('กรุณาเลือกเมนูอย่างน้อย 1 รายการ')
    setPlacing(true)
    try {
      const sessionCode = `CASHIER-${Date.now()}`
      const res = await fetch(`${BASE}/api/public/${tenant!.slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTableId,
          sessionCode,
          notes: notes.trim() || undefined,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, unitPrice: c.unitPrice, options: [] })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`ส่งออร์เดอร์เข้าครัวแล้ว! โต๊ะ ${selectedTable?.code}`)
      router.push('/cashier')
    } catch {
      toast.error('สั่งอาหารไม่สำเร็จ')
    } finally {
      setPlacing(false)
    }
  }

  // ── Menu step ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-gray-900">สั่งอาหารแทนลูกค้า</h1>
          <p className="text-xs text-gray-400">แคชเชียร์สั่งแทน</p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold">
            <ShoppingBag className="w-3.5 h-3.5" />
            {totalItems} · {formatPrice(total)}
          </div>
        )}
      </div>

      {/* Table selector */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 flex-shrink-0">โต๊ะ:</span>
        <div className="relative flex-1 max-w-xs">
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-orange-400 pr-8"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Category tabs */}
      {menu && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {menu.categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="flex-1 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {!menu && (
          <div className="col-span-full flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
        {activeItems.map((item: any) => {
          const inCart = cart.find((c) => c.menuItemId === item.id)
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                {item.nameEn && <p className="text-xs text-gray-400 mt-0.5">{item.nameEn}</p>}
                <p className="text-sm font-extrabold text-orange-500 mt-1.5">{formatPrice(Number(item.price))}</p>
              </div>
              {inCart ? (
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    {inCart.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-gray-700" />}
                  </button>
                  <span className="text-sm font-extrabold text-gray-900 w-5 text-center">{inCart.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center active:scale-90 transition-transform">
                    <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(item)}
                  className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center flex-shrink-0 transition-colors active:scale-90"
                >
                  <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      {cart.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-6 py-4 sticky bottom-0 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุ (เช่น ไม่ใส่ผัก, แพ้ถั่ว...)"
            rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-orange-400 resize-none"
          />
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-2xl font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30"
          >
            <ShoppingBag className="w-5 h-5" />
            {placing ? 'กำลังส่งออร์เดอร์...' : `ดำเนินการ ${totalItems} รายการ · ${formatPrice(total)}`}
          </button>
        </div>
      )}
    </div>
  )
}
