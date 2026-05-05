'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MenuDto, MenuItemDto, CartItemOption, CartItem } from '@tableflow/types'
import { useCartStore } from '@/store/cart.store'
import { formatPrice, generateSessionCode } from '@/lib/utils'
import { ShoppingCart, Bell, Search, Plus, Minus, X, ChevronDown, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  menu: MenuDto
  tableId: string
  tableCode: string
  tenant: string
  table: string
}

export default function MenuScreen({ menu, tableId, tableCode, tenant, table }: Props) {
  const router = useRouter()
  const { items, addItem, totalItems, totalPrice, setSession, sessionCode } = useCartStore()
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.id ?? '')
  const [selectedItem, setSelectedItem] = useState<MenuItemDto | null>(null)
  const [search, setSearch] = useState('')
  const catBarRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Initialize session
  useEffect(() => {
    setSession({
      sessionCode: sessionCode ?? generateSessionCode(),
      tenantSlug: tenant,
      tableId,
      tableCode,
    })
  }, [])

  const filteredItems = search
    ? menu.items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          (i.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : menu.items

  const itemsByCategory = menu.categories.reduce<Record<string, MenuItemDto[]>>((acc, cat) => {
    acc[cat.id] = filteredItems.filter((i) => i.categoryId === cat.id)
    return acc
  }, {})

  const scrollToCategory = (catId: string) => {
    setActiveCat(catId)
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Scroll cat tab into view
    const tab = catBarRef.current?.querySelector(`[data-cat="${catId}"]`)
    tab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const cartCount = totalItems()
  const cartTotal = totalPrice()

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="flex-1">
            <p className="text-xs text-stone-400 font-medium">สั่งอาหาร</p>
            <p className="text-base font-bold text-stone-900">{tableCode}</p>
          </div>
          <button
            onClick={() => router.push(`/${tenant}/${table}/cart`)}
            className="relative bg-stone-100 hover:bg-stone-200 rounded-xl p-2.5 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-stone-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-in">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาเมนู..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div
            ref={catBarRef}
            className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar"
          >
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  activeCat === cat.id
                    ? 'bg-orange-500 text-white shadow-brand'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                )}
              >
                {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto pb-28">
        {search ? (
          <div className="px-4 pt-4">
            <p className="text-sm text-stone-500 mb-4">
              {filteredItems.length} รายการสำหรับ "{search}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />
              ))}
            </div>
          </div>
        ) : (
          menu.categories.map((cat) => {
            const catItems = itemsByCategory[cat.id] ?? []
            if (catItems.length === 0) return null
            return (
              <div
                key={cat.id}
                ref={(el) => { sectionRefs.current[cat.id] = el }}
                className="pt-6"
              >
                <div className="flex items-center gap-2 px-4 mb-3">
                  {cat.icon && <span className="text-xl">{cat.icon}</span>}
                  <h2 className="text-base font-bold text-stone-900">{cat.name}</h2>
                  <span className="text-xs text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
                    {catItems.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {catItems.map((item) => (
                    <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
          <button
            onClick={() => router.push(`/${tenant}/${table}/cart`)}
            className="w-full bg-orange-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-brand active:scale-95 transition-transform"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">
              {cartCount} รายการ
            </span>
            <span className="font-semibold text-base">ดูตะกร้า</span>
            <span className="font-bold text-base">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Food detail sheet */}
      {selectedItem && (
        <FoodDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={(item) => {
            addItem(item)
            setSelectedItem(null)
            toast.success(`เพิ่ม ${item.menuItemName} ลงตะกร้า`)
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Food Card
// ─────────────────────────────────────────────

function FoodCard({ item, onSelect }: { item: MenuItemDto; onSelect: (item: MenuItemDto) => void }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className={cn(
        'bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-card text-left active:scale-95 transition-transform',
        !item.isAvailable && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="relative aspect-square bg-stone-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isPopular && (
            <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" /> ฮิต
            </span>
          )}
          {item.isNew && (
            <span className="bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> ใหม่
            </span>
          )}
        </div>
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">หมดชั่วคราว</span>
          </div>
        )}
        {/* Quick add */}
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-semibold text-stone-900 line-clamp-2 leading-tight mb-1">{item.name}</p>
        <p className="text-sm font-bold text-orange-500">{formatPrice(item.price)}</p>
        {item.preparationTime && (
          <p className="text-xs text-stone-400 mt-0.5">⏱ {item.preparationTime} นาที</p>
        )}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// Food Detail Bottom Sheet
// ─────────────────────────────────────────────

interface FoodDetailProps {
  item: MenuItemDto
  onClose: () => void
  onAdd: (item: CartItem) => void
}

function FoodDetailSheet({ item, onClose, onAdd }: FoodDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption[]>>(() => {
    // Pre-select defaults
    const defaults: Record<string, CartItemOption[]> = {}
    for (const og of item.optionGroups) {
      const defaultOpts = og.options.filter((o) => o.isDefault)
      if (defaultOpts.length > 0) {
        defaults[og.id] = defaultOpts.map((o) => ({
          optionId: o.id,
          optionGroupId: og.id,
          name: o.name,
          priceAdjust: o.priceAdjust,
        }))
      }
    }
    return defaults
  })

  const toggleOption = (groupId: string, opt: { id: string; name: string; priceAdjust: number }, type: 'SINGLE' | 'MULTIPLE', maxSelect: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] ?? []
      const mapped: CartItemOption = { optionId: opt.id, optionGroupId: groupId, name: opt.name, priceAdjust: opt.priceAdjust }
      const exists = current.some((o) => o.optionId === opt.id)

      if (type === 'SINGLE') {
        return { ...prev, [groupId]: [mapped] }
      }

      if (exists) {
        return { ...prev, [groupId]: current.filter((o) => o.optionId !== opt.id) }
      }

      if (current.length >= maxSelect) return prev
      return { ...prev, [groupId]: [...current, mapped] }
    })
  }

  const allSelected = Object.values(selectedOptions).flat()

  const optionsPrice = allSelected.reduce((s, o) => s + o.priceAdjust, 0)
  const totalItemPrice = (item.price + optionsPrice) * quantity

  const handleAdd = () => {
    // Check required groups
    for (const og of item.optionGroups) {
      if (og.required && !(selectedOptions[og.id]?.length ?? 0)) {
        toast.error(`กรุณาเลือก ${og.name}`)
        return
      }
    }

    onAdd({
      menuItemId: item.id,
      menuItemName: item.name,
      menuItemImage: item.imageUrl,
      quantity,
      unitPrice: item.price,
      notes: notes || undefined,
      selectedOptions: allSelected,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Image */}
        <div className="relative aspect-video w-full bg-stone-100 rounded-t-3xl overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md"
          >
            <X className="w-4 h-4 text-stone-700" />
          </button>
          <div className="absolute top-4 left-4 flex gap-1.5">
            {item.isPopular && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ ฮิต</span>
            )}
            {item.isNew && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">✨ ใหม่</span>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{item.name}</h2>
            {item.nameEn && <p className="text-sm text-stone-500">{item.nameEn}</p>}
            {item.description && <p className="text-sm text-stone-600 mt-2 leading-relaxed">{item.description}</p>}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xl font-bold text-orange-500">{formatPrice(item.price)}</span>
              {item.preparationTime && (
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                  ⏱ {item.preparationTime} นาที
                </span>
              )}
              {item.calories && (
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                  🔥 {item.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Option groups */}
          {item.optionGroups.map((og) => (
            <div key={og.id}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-stone-800">{og.name}</h3>
                {og.required && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">จำเป็น</span>
                )}
                {og.type === 'MULTIPLE' && (
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    เลือกได้ {og.maxSelect} อย่าง
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {og.options.map((opt) => {
                  const isSelected = (selectedOptions[og.id] ?? []).some((o) => o.optionId === opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(og.id, opt, og.type, og.maxSelect)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center transition-colors',
                          og.type === 'SINGLE' ? 'rounded-full' : 'rounded',
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-stone-300'
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={cn('flex-1 text-sm font-medium', isSelected ? 'text-orange-700' : 'text-stone-700')}>
                        {opt.name}
                      </span>
                      {opt.priceAdjust !== 0 && (
                        <span className={cn('text-sm font-semibold', isSelected ? 'text-orange-500' : 'text-stone-500')}>
                          +{formatPrice(opt.priceAdjust)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-bold text-stone-800 mb-2">หมายเหตุ (ถ้ามี)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ไม่ใส่ผัก, แพ้อาหาร..."
              rows={2}
              className="w-full text-sm border border-stone-200 rounded-xl p-3 resize-none outline-none focus:border-orange-400 placeholder-stone-300"
            />
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 pb-safe border-t border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-full border-2 border-stone-200 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="w-4 h-4 text-stone-700" />
              </button>
              <span className="text-lg font-bold text-stone-900 w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus className="w-4 h-4 text-white" strokeWidth={3} />
              </button>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-stone-400">รวม</p>
              <p className="text-xl font-bold text-orange-500">{formatPrice(totalItemPrice)}</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-base shadow-brand active:scale-95 transition-transform"
          >
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </div>
  )
}
