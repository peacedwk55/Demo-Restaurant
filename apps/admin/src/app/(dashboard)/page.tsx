'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { DashboardSummary, SalesDataPoint, PopularItem } from '@tableflow/types'
import { TrendingUp, TrendingDown, ShoppingBag, TableProperties, DollarSign, Clock } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [sales, setSales]     = useState<SalesDataPoint[]>([])
  const [popular, setPopular] = useState<PopularItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getAnalytics(), adminApi.getSalesData(7), adminApi.getPopularItems()])
      .then(([s, sl, p]) => { setSummary(s); setSales(sl); setPopular(p) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="h-8 w-48 bg-gray-100 rounded-lg mb-2 skeleton" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-8 skeleton" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl skeleton border border-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-white rounded-2xl skeleton border border-gray-100" />
          <div className="h-64 bg-white rounded-2xl skeleton border border-gray-100" />
        </div>
      </div>
    )
  }

  const kpis = summary ? [
    {
      label: 'ยอดขายวันนี้',
      sublabel: "Today's Sales",
      value: formatPrice(summary.todaySales),
      change: summary.salesChange,
      icon: DollarSign,
      gradient: 'from-orange-500 to-orange-400',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'ออร์เดอร์วันนี้',
      sublabel: "Today's Orders",
      value: summary.todayOrders.toString(),
      change: summary.ordersChange,
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-blue-400',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'โต๊ะที่ใช้งาน',
      sublabel: 'Active Tables',
      value: `${summary.activeTables}/${summary.totalTables}`,
      change: null,
      icon: TableProperties,
      gradient: 'from-emerald-500 to-emerald-400',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'รอดำเนินการ',
      sublabel: 'Pending Orders',
      value: summary.pendingOrders.toString(),
      change: null,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-400',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ] : []

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', kpi.iconBg)}>
                  <Icon className={cn('w-5 h-5', kpi.iconColor)} />
                </div>
                {kpi.change !== null && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    kpi.change >= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500'
                  )}>
                    {kpi.change >= 0
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-sm font-semibold text-gray-600 mt-1">{kpi.label}</p>
              <p className="text-xs text-gray-400">{kpi.sublabel}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">ยอดขาย 7 วัน</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sales Trend</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              7 วันที่ผ่านมา
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sales} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [formatPrice(v), 'ยอดขาย']}
                labelStyle={{ fontSize: 12, color: '#374151' }}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Popular items */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">เมนูยอดนิยม</h2>
            <p className="text-xs text-gray-400 mt-0.5">Top Items by Orders</p>
          </div>
          <div className="space-y-4">
            {popular.slice(0, 6).map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0 ? 'bg-orange-500 text-white' :
                  i === 1 ? 'bg-orange-100 text-orange-600' :
                  i === 2 ? 'bg-stone-100 text-stone-600' :
                  'text-gray-300 font-medium'
                )}>
                  {i < 3 ? (i + 1) : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-1">
                      <div
                        className="bg-orange-500 h-1 rounded-full transition-all"
                        style={{ width: `${popular[0] ? (item.totalOrdered / popular[0].totalOrdered) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 w-6 text-right">{item.totalOrdered}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders volume */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">จำนวนออร์เดอร์</h2>
            <p className="text-xs text-gray-400 mt-0.5">Orders Volume</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sales} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => [v, 'ออร์เดอร์']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            />
            <Bar dataKey="orders" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
