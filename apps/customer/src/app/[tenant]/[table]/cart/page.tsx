'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart.store'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Trash2, Minus, Plus, ChevronRight, ShoppingCart } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function CartPage() {
  const params = useParams<{ tenant: string; table: string }>()
  const router = useRouter()
  const { items, removeItem, updateQuantity, updateNotes, clearCart, totalPrice, tableId, sessionCode, tenantSlug } = useCartStore()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">ตะกร้าว่าง</h2>
        <p className="text-stone-500 text-sm mb-6">เพิ่มรายการอาหารจากเมนูก่อนนะคะ</p>
        <button
          onClick={() => router.push(`/${params.tenant}/${params.table}/menu`)}
          className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm shadow-brand"
        >
          ไปที่เมนู
        </button>
      </div>
    )
  }

  const subtotal = totalPrice()

  const handlePlaceOrder = async () => {
    if (!tableId || !sessionCode || !tenantSlug) {
      toast.error('ข้อมูลโต๊ะไม่ครบ กรุณาสแกน QR ใหม่')
      return
    }

    setLoading(true)
    try {
      const order = await api.createOrder(tenantSlug, {
        tableId,
        sessionCode,
        notes: notes || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          options: item.selectedOptions.map((o) => ({
            optionId: o.optionId,
            name: o.name,
            priceAdjust: o.priceAdjust,
          })),
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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div>
          <h1 className="text-base font-bold text-stone-900">ตะกร้าของคุณ</h1>
          <p className="text-xs text-stone-500">{items.reduce((s, i) => s + i.quantity, 0)} รายการ</p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {items.map((item, idx) => {
          const optionsPrice = item.selectedOptions.reduce((s, o) => s + o.priceAdjust, 0)
          const linePrice = (item.unitPrice + optionsPrice) * item.quantity
          return (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                  {item.menuItemImage ? (
                    <Image src={item.menuItemImage} alt={item.menuItemName} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-stone-900 leading-tight">{item.menuItemName}</p>
                    <button onClick={() => removeItem(idx)} className="ml-2 text-red-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                      {item.selectedOptions.map((o) => o.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-orange-500 mt-0.5">📝 {item.notes}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Minus className="w-3 h-3 text-stone-700" />
                      </button>
                      <span className="text-sm font-bold text-stone-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-orange-500">{formatPrice(linePrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Order notes */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800 mb-2">หมายเหตุเพิ่มเติม</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น แพ้อาหาร, ต้องการช้อนส้อมเพิ่ม..."
            rows={2}
            className="w-full text-sm border border-stone-200 rounded-xl p-3 resize-none outline-none focus:border-orange-400 placeholder-stone-300"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">ยอดรวม</span>
            <span className="font-semibold text-stone-800">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
            <span className="font-semibold text-stone-800">{formatPrice(Math.round(subtotal * 0.07))}</span>
          </div>
          <div className="border-t border-stone-100 pt-2 flex justify-between">
            <span className="font-bold text-stone-900">รวมทั้งสิ้น</span>
            <span className="font-bold text-xl text-orange-500">{formatPrice(Math.round(subtotal * 1.07))}</span>
          </div>
        </div>
      </div>

      {/* Place order */}
      <div className="px-4 pb-safe pt-3 bg-white border-t border-stone-100">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-orange-500 disabled:bg-orange-300 text-white py-4 rounded-2xl font-bold text-base shadow-brand active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังส่งออร์เดอร์...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              ยืนยันการสั่งอาหาร · {formatPrice(Math.round(subtotal * 1.07))}
            </>
          )}
        </button>
        <p className="text-center text-xs text-stone-400 mt-2">การชำระเงินจะดำเนินการหลังอาหารเสร็จ</p>
      </div>
    </div>
  )
}
