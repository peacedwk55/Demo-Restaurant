'use client'
import { useState, useRef, useEffect } from 'react'
import { MenuDto, MenuItemDto, CartItemOption, CartItem } from '@tableflow/types'
import { useCartStore } from '@/store/cart.store'
import { formatPrice, generateSessionCode } from '@/lib/utils'
import { ShoppingCart, Search, Plus, Minus, X, Star, Sparkles, Clock, Flame } from 'lucide-react'
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

  useEffect(() => {
    setSession({ sessionCode: sessionCode ?? generateSessionCode(), tenantSlug: tenant, tableId, tableCode })
  }, [])

  const filteredItems = search
    ? menu.items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : menu.items

  const itemsByCategory = menu.categories.reduce<Record<string, MenuItemDto[]>>((acc, cat) => {
    acc[cat.id] = filteredItems.filter(i => i.categoryId === cat.id)
    return acc
  }, {})

  const scrollToCategory = (catId: string) => {
    setActiveCat(catId)
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    catBarRef.current?.querySelector(`[data-cat="${catId}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const cartCount = totalItems()
  const cartTotal = totalPrice()

  return (
    <div className="flex flex-col h-screen bg-[#fafaf9] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100/80">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="flex-1">
            <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-widest">โต๊ะ {tableCode}</p>
            <p className="text-lg font-bold text-stone-900 leading-tight">{menu.tenant.name}</p>
          </div>
          <button
            onClick={() => router.push(`/${tenant}/${table}/cart`)}
            className="relative w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-brand active:scale-90 transition-transform"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-white text-orange-500 text-xs font-extrabold rounded-full flex items-center justify-center px-1 border-2 border-orange-500 animate-bounce-in">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-stone-100 rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาเมนูที่ชอบ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-stone-400 active:scale-90 transition-transform">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!search && (
          <div ref={catBarRef} className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
            {menu.categories.map(cat => (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200',
                  activeCat === cat.id
                    ? 'bg-orange-500 text-white shadow-brand scale-100'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                )}
              >
                {cat.icon && <span className="text-sm leading-none">{cat.icon}</span>}
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {search ? (
          <div className="px-4 pt-5">
            <p className="text-xs text-stone-400 font-medium mb-4">พบ {filteredItems.length} รายการสำหรับ "{search}"</p>
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map(item => <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />)}
            </div>
          </div>
        ) : (
          menu.categories.map(cat => {
            const catItems = itemsByCategory[cat.id] ?? []
            if (!catItems.length) return null
            return (
              <div key={cat.id} ref={el => { sectionRefs.current[cat.id] = el }} className="pt-6">
                <div className="flex items-center gap-2 px-4 mb-3">
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <h2 className="text-base font-bold text-stone-900">{cat.name}</h2>
                  <span className="text-[11px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full">{catItems.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {catItems.map(item => <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />)}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-8 bg-gradient-to-t from-white via-white/90 to-transparent z-20 pointer-events-none">
          <button
            onClick={() => router.push(`/${tenant}/${table}/cart`)}
            className="pointer-events-auto w-full bg-orange-500 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-brand active:scale-95 transition-all duration-150"
          >
            <div className="bg-white/25 rounded-xl px-2.5 py-1 min-w-[36px] text-center">
              <span className="text-sm font-extrabold">{cartCount}</span>
            </div>
            <span className="font-bold text-base">ดูตะกร้า</span>
            <span className="font-bold text-base">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {selectedItem && (
        <FoodDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={item => { addItem(item); setSelectedItem(null); toast.success(`เพิ่ม ${item.menuItemName} แล้ว 🛒`) }}
        />
      )}
    </div>
  )
}

function FoodCard({ item, onSelect }: { item: MenuItemDto; onSelect: (item: MenuItemDto) => void }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className={cn(
        'bg-white rounded-3xl overflow-hidden shadow-card text-left active:scale-95 transition-all duration-150 border border-stone-100/60',
        !item.isAvailable && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="50vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isPopular && (
            <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current" /> ฮิต
            </span>
          )}
          {item.isNew && (
            <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> ใหม่
            </span>
          )}
        </div>

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-xl backdrop-blur-sm">หมดชั่วคราว</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2.5">
          <span className="text-white font-extrabold text-sm drop-shadow-md">{formatPrice(item.price)}</span>
        </div>
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-brand">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug">{item.name}</p>
        {item.preparationTime && (
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />{item.preparationTime} นาที
          </p>
        )}
      </div>
    </button>
  )
}

interface FoodDetailProps {
  item: MenuItemDto
  onClose: () => void
  onAdd: (item: CartItem) => void
}

function FoodDetailSheet({ item, onClose, onAdd }: FoodDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption[]>>(() => {
    const defaults: Record<string, CartItemOption[]> = {}
    for (const og of item.optionGroups) {
      const def = og.options.filter(o => o.isDefault)
      if (def.length) defaults[og.id] = def.map(o => ({ optionId: o.id, optionGroupId: og.id, name: o.name, priceAdjust: o.priceAdjust }))
    }
    return defaults
  })

  const toggleOption = (groupId: string, opt: { id: string; name: string; priceAdjust: number }, type: 'SINGLE' | 'MULTIPLE', maxSelect: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] ?? []
      const mapped: CartItemOption = { optionId: opt.id, optionGroupId: groupId, name: opt.name, priceAdjust: opt.priceAdjust }
      const exists = current.some(o => o.optionId === opt.id)
      if (type === 'SINGLE') return { ...prev, [groupId]: [mapped] }
      if (exists) return { ...prev, [groupId]: current.filter(o => o.optionId !== opt.id) }
      if (current.length >= maxSelect) return prev
      return { ...prev, [groupId]: [...current, mapped] }
    })
  }

  const allSelected = Object.values(selectedOptions).flat()
  const optionsPrice = allSelected.reduce((s, o) => s + o.priceAdjust, 0)
  const totalItemPrice = (item.price + optionsPrice) * quantity

  const handleAdd = () => {
    for (const og of item.optionGroups) {
      if (og.required && !(selectedOptions[og.id]?.length ?? 0)) {
        toast.error(`กรุณาเลือก ${og.name}`)
        return
      }
    }
    onAdd({ menuItemId: item.id, menuItemName: item.name, menuItemImage: item.imageUrl, quantity, unitPrice: item.price, notes: notes || undefined, selectedOptions: allSelected })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-[2rem] max-h-[92vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Hero image */}
        <div className="relative h-56 w-full bg-gradient-to-br from-orange-50 to-amber-50 rounded-t-[2rem] overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
            <X className="w-4 h-4 text-stone-700" />
          </button>
          <div className="absolute top-4 left-4 flex gap-1.5">
            {item.isPopular && <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">⭐ ฮิต</span>}
            {item.isNew && <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">✨ ใหม่</span>}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 leading-tight">{item.name}</h2>
              {item.nameEn && <p className="text-sm text-stone-400 mt-0.5">{item.nameEn}</p>}
              {item.description && <p className="text-sm text-stone-500 mt-2 leading-relaxed">{item.description}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-2xl font-extrabold text-orange-500">{formatPrice(item.price)}</span>
                {item.preparationTime && (
                  <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.preparationTime} นาที
                  </span>
                )}
                {item.calories && (
                  <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {item.calories} kcal
                  </span>
                )}
              </div>
            </div>

            {item.optionGroups.map(og => (
              <div key={og.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold text-stone-800">{og.name}</h3>
                  {og.required && <span className="text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-semibold">จำเป็น</span>}
                  {og.type === 'MULTIPLE' && <span className="text-[11px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">เลือกได้ {og.maxSelect}</span>}
                </div>
                <div className="space-y-2">
                  {og.options.map(opt => {
                    const isSelected = (selectedOptions[og.id] ?? []).some(o => o.optionId === opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(og.id, opt, og.type, og.maxSelect)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-150 text-left active:scale-[0.98]',
                          isSelected ? 'border-orange-400 bg-orange-50' : 'border-stone-150 bg-stone-50'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center transition-all',
                          og.type === 'SINGLE' ? 'rounded-full' : 'rounded-md',
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-stone-300 bg-white'
                        )}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={cn('flex-1 text-sm font-medium', isSelected ? 'text-orange-700' : 'text-stone-700')}>{opt.name}</span>
                        {opt.priceAdjust !== 0 && (
                          <span className={cn('text-sm font-bold', isSelected ? 'text-orange-500' : 'text-stone-400')}>+{formatPrice(opt.priceAdjust)}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-bold text-stone-800 mb-2">หมายเหตุ (ถ้ามี)</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก, แพ้ถั่วลิสง..."
                rows={2}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-2xl p-3.5 resize-none outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder-stone-300"
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 pb-safe border-t border-stone-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3 bg-stone-100 rounded-2xl p-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                <Minus className="w-4 h-4 text-stone-700" />
              </button>
              <span className="text-lg font-extrabold text-stone-900 w-7 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-brand active:scale-90 transition-transform">
                <Plus className="w-4 h-4 text-white" strokeWidth={3} />
              </button>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-stone-400 font-medium">รวม</p>
              <p className="text-2xl font-extrabold text-orange-500">{formatPrice(totalItemPrice)}</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-extrabold text-base shadow-brand active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </div>
  )
}
