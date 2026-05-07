'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { BarChart3, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']

export default function AnalyticsPage() {
  const [sales, setSales]     = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [range, setRange]     = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([adminApi.getSalesData(range), adminApi.getPopularItems()])
      .then(([s, p]) => { setSales(s); setPopular(p) })
      .finally(() => setLoading(false))
  }, [range])

  const totalSales  = sales.reduce((s, d) => s + d.sales, 0)
  const totalOrders = sales.reduce((s, d) => s + d.orders, 0)
  const avgPerOrder = totalOrders ? totalSales / totalOrders : 0

  const summaryStats = [
    { label: 'ยอดขายรวม', sublabel: 'Total Sales', value: formatPrice(totalSales), icon: DollarSign, iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'ออร์เดอร์รวม', sublabel: 'Total Orders', value: totalOrders, icon: ShoppingBag, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'เฉลี่ยต่อออร์เดอร์', sublabel: 'Avg per Order', value: formatPrice(Math.round(avgPerOrder)), icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  ]

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">รายงานยอดขายและเมนูยอดนิยม</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                range === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                  <p className="text-[10px] text-gray-400">{stat.sublabel}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">ยอดขาย</h2>
            <p className="text-xs text-gray-400 mt-0.5">{range} วันที่ผ่านมา</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sales}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [formatPrice(v), 'ยอดขาย']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">จำนวนออร์เดอร์</h2>
            <p className="text-xs text-gray-400 mt-0.5">{range} วันที่ผ่านมา</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [v, 'ออร์เดอร์']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              />
              <Bar dataKey="orders" fill="#f97316" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular items + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">เมนูทำรายได้สูงสุด</h2>
            <p className="text-xs text-gray-400 mt-0.5">Top Items by Revenue</p>
          </div>
          <div className="space-y-4">
            {popular.slice(0, 8).map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <span className={`w-5 text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'text-orange-500' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-amber-600' : 'text-gray-300'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${popular[0] ? (item.totalRevenue / popular[0].totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{formatPrice(item.totalRevenue)}</p>
                  <p className="text-xs text-gray-400">{item.totalOrdered} ชิ้น</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">สัดส่วนรายได้</h2>
            <p className="text-xs text-gray-400 mt-0.5">Revenue Distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={popular.slice(0, 6)}
                dataKey="totalRevenue"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={90}
                innerRadius={52}
                paddingAngle={3}
              >
                {popular.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatPrice(v)}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
