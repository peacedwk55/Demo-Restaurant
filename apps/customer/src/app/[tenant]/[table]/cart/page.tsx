'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart.store'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, ChevronRight, Receipt } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function CartPage() {
  const params = useParams<{ tenant: string; table: string }>()
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, tableId, sessionCode, tenantSlug } = useCartStore()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-5">
          <ShoppingBag className="w-10 h-10 text-orange-300" />
        </div>
        <h2 className="text-xl font-extrabold text-stone-900 mb-2">ตะกร้าว่างเปล่า</h2>
        <p className="text-stone-400 text-sm mb-8">เพิ่มรายการอาหารจากเมนูก่อนนะคะ</p>
        <button
          onClick={() => router.push(`/${params.tenant}/${params.table}/menu`)}
          className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-brand active:scale-95 transition-transform"
        >
          ดูเมนูอาหาร
        </button>
      </div>
    )
  }

  const subtotal = totalPrice()
  const vat = Math.round(subtotal * 0.07)
  const grandTotal = subtotal + vat

  const handlePlaceOrder = async () => {
    if (!tableId || !sessionCode || !tenantSlug) {
      toast.error('ข้อมูลโต๊ะไม่ครบ กรุณาสแกน QR ใหม่')
      return
    }
    setLoading(true)
    try {
      const order = await api.createOrder(tenantSlug, {
        tableId, sessionCode,
        notes: notes || undefined,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          options: item.selectedOptions.map(o => ({ optionId: o.optionId, name: o.name, priceAdjust: o.priceAdjust })),
        })),
      })
      clearCart()
      toast.success('ส่งออร์เดอร์เรียบร้อย! 🎉')
      router.push(`/${params.tenant}/${params.table}/order/${order.id}`)
    } catch (err: any) {
      toast.error(err.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-stone-900">ตะกร้าของคุณ</h1>
          <p className="text-xs text-stone-400">{items.reduce((s, i) => s + i.quantity, 0)} รายการ</p>
        </div>
        <button onClick={() => router.push(`/${params.tenant}/${params.table}/menu`)} className="text-orange-500 text-sm font-semibold active:opacity-70 transition-opacity">
          + เพิ่มเมนู
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Items */}
        {items.map((item, idx) => {
          const optPrice = item.selectedOptions.reduce((s, o) => s + o.priceAdjust, 0)
          const linePrice = (item.unitPrice + optPrice) * item.quantity
          return (
            <div key={idx} className="bg-white rounded-3xl p-4 shadow-card border border-stone-100/60">
              <div className="flex gap-3">
                <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden flex-shrink-0" style={{ width: 72, height: 72 }}>
                  {item.menuItemImage ? (
                    <Image src={item.menuItemImage} alt={item.menuItemName} width={72} height={72} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-stone-900 leading-tight">{item.menuItemName}</p>
                    <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{item.selectedOptions.map(o => o.name).join(' · ')}</p>
                  )}
                  {item.notes && <p className="text-xs text-orange-500 mt-0.5">📝 {item.notes}</p>}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-0.5">
                      <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                        <Minus className="w-3 h-3 text-stone-700" />
                      </button>
                      <span className="text-sm font-extrabold text-stone-900 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-sm font-extrabold text-orange-500">{formatPrice(linePrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Notes */}
        <div className="bg-white rounded-3xl p-4 shadow-card border border-stone-100/60">
          <h3 className="text-sm font-bold text-stone-800 mb-2.5 flex items-center gap-2">
            <span className="text-base">📝</span> หมายเหตุถึงครัว
          </h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="เช่น แพ้อาหาร, ต้องการช้อนส้อมเพิ่ม..."
            rows={2}
            className="w-full text-sm bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 resize-none outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder-stone-300"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-stone-100/60">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-stone-400" />
            <h3 className="text-sm font-bold text-stone-700">สรุปคำสั่งซื้อ</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">ยอดรวม</span>
              <span className="font-semibold text-stone-800">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span className="font-semibold text-stone-800">{formatPrice(vat)}</span>
            </div>
            <div className="h-px bg-stone-100 my-1" />
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-stone-900">รวมทั้งสิ้น</span>
              <span className="font-extrabold text-2xl text-orange-500">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 pb-2">การชำระเงินจะดำเนินการหลังอาหารเสร็จ</p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 pt-3 bg-white border-t border-stone-100 sticky bottom-0">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-orange-500 disabled:bg-orange-300 text-white py-4 rounded-2xl font-extrabold text-base shadow-brand active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังส่งออร์เดอร์...</>
          ) : (
            <><ShoppingBag className="w-5 h-5" /> ยืนยันคำสั่งซื้อ · {formatPrice(grandTotal)}</>
          )}
        </button>
      </div>
    </div>
  )
}
