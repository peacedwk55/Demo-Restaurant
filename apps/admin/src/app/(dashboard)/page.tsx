'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { DashboardSummary, SalesDataPoint, PopularItem } from '@tableflow/types'
import { TrendingUp, TrendingDown, ShoppingBag, TableProperties, DollarSign, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [sales, setSales] = useState<SalesDataPoint[]>([])
  const [popular, setPopular] = useState<PopularItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getAnalytics(), adminApi.getSalesData(7), adminApi.getPopularItems()])
      .then(([s, sl, p]) => { setSummary(s); setSales(sl); setPopular(p) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  const kpis = summary
    ? [
        { label: "Today's Sales", value: formatPrice(summary.todaySales), change: summary.salesChange, icon: DollarSign, color: 'orange' },
        { label: "Today's Orders", value: summary.todayOrders.toString(), change: summary.ordersChange, icon: ShoppingBag, color: 'blue' },
        { label: 'Active Tables', value: `${summary.activeTables}/${summary.totalTables}`, change: null, icon: TableProperties, color: 'green' },
        { label: 'Pending Orders', value: summary.pendingOrders.toString(), change: null, icon: Clock, color: 'amber' },
      ]
    : []

  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', ring: 'ring-orange-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'ring-blue-100' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-500', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500', ring: 'ring-amber-100' },
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const colors = colorMap[kpi.color]
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
              </div>
              {kpi.change !== null && (
                <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {kpi.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(kpi.change)}% vs yesterday
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-base font-bold text-gray-900 mb-1">Sales Trend</h2>
          <p className="text-xs text-gray-400 mb-5">Last 7 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sales} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatPrice(v)}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Popular items */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-base font-bold text-gray-900 mb-1">Top Items</h2>
          <p className="text-xs text-gray-400 mb-5">By order count</p>
          <div className="space-y-3">
            {popular.slice(0, 6).map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${popular[0] ? (item.totalOrdered / popular[0].totalOrdered) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.totalOrdered}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders by hour */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <h2 className="text-base font-bold text-gray-900 mb-1">Orders Volume</h2>
        <p className="text-xs text-gray-400 mb-5">Last 7 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sales} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="orders" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
