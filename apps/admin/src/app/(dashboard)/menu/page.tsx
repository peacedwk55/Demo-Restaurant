'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { UtensilsCrossed, Plus, Toggle, Eye, EyeOff, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    const [cats, its] = await Promise.all([adminApi.getMenuCategories(), adminApi.getMenuItems()])
    setCategories(cats)
    setItems(its)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggle = async (id: string) => {
    try {
      await adminApi.toggleItemAvailability(id)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)))
      toast.success('Availability updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await adminApi.deleteMenuItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Item deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filteredItems = items
    .filter((i) => activeCategory === 'ALL' || i.categoryId === activeCategory)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Menu Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} items across {categories.length} categories</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Search + category filter */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={cn('flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all', activeCategory === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200')}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn('flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all', activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200')}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Items table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId)
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          {item.nameEn && <p className="text-xs text-gray-400">{item.nameEn}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {cat?.icon} {cat?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-800">{formatPrice(Number(item.price))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                          item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {item.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">No items found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
