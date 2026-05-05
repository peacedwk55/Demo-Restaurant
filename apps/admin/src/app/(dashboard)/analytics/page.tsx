'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']

export default function AnalyticsPage() {
  const [sales, setSales] = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [range, setRange] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([adminApi.getSalesData(range), adminApi.getPopularItems()])
      .then(([s, p]) => { setSales(s); setPopular(p) })
      .finally(() => setLoading(false))
  }, [range])

  const totalSales = sales.reduce((s, d) => s + d.sales, 0)
  const totalOrders = sales.reduce((s, d) => s + d.orders, 0)
  const avgPerOrder = totalOrders ? totalSales / totalOrders : 0

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Analytics
          </h1>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${range === d ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sales', value: formatPrice(totalSales) },
          { label: 'Total Orders', value: totalOrders },
          { label: 'Avg Order', value: formatPrice(Math.round(avgPerOrder)) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Sales ({range}d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sales}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ borderRadius: 10 }} />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Orders ({range}d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Top Items by Revenue</h2>
          <div className="space-y-3">
            {popular.slice(0, 8).map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-gray-400 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${popular[0] ? (item.totalRevenue / popular[0].totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{formatPrice(item.totalRevenue)}</p>
                  <p className="text-xs text-gray-400">{item.totalOrdered} ordered</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={popular.slice(0, 6)}
                dataKey="totalRevenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
              >
                {popular.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ borderRadius: 10 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
