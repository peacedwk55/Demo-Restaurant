import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { DashboardSummary, SalesDataPoint, PopularItem } from '@tableflow/types'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(tenantId: string): Promise<DashboardSummary> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const [
      todayOrders,
      yesterdayOrders,
      activeTables,
      totalTables,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: today }, status: { notIn: ['CANCELLED'] } },
        select: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: yesterday, lt: today }, status: { notIn: ['CANCELLED'] } },
        select: { totalAmount: true },
      }),
      this.prisma.table.count({ where: { tenantId, status: { in: ['OCCUPIED', 'PAYMENT_PENDING'] } } }),
      this.prisma.table.count({ where: { tenantId, isActive: true } }),
      this.prisma.order.count({ where: { tenantId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
    ])

    const todaySales = todayOrders.reduce((s, o) => s + Number(o.totalAmount), 0)
    const yesterdaySales = yesterdayOrders.reduce((s, o) => s + Number(o.totalAmount), 0)
    const avgOrderValue = todayOrders.length ? todaySales / todayOrders.length : 0
    const salesChange = yesterdaySales === 0 ? 0 : ((todaySales - yesterdaySales) / yesterdaySales) * 100
    const ordersChange =
      yesterdayOrders.length === 0 ? 0 : ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100

    return {
      todaySales,
      todayOrders: todayOrders.length,
      activeTables,
      totalTables,
      avgOrderValue: Math.round(avgOrderValue),
      pendingOrders,
      salesChange: Math.round(salesChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
    }
  }

  async getSalesData(tenantId: string, days = 7): Promise<SalesDataPoint[]> {
    const from = new Date()
    from.setDate(from.getDate() - days)
    from.setHours(0, 0, 0, 0)

    const orders = await this.prisma.order.findMany({
      where: { tenantId, createdAt: { gte: from }, status: { notIn: ['CANCELLED'] } },
      select: { totalAmount: true, createdAt: true },
    })

    const byDate = orders.reduce<Record<string, { sales: number; orders: number }>>((acc, o) => {
      const date = o.createdAt.toISOString().split('T')[0]
      if (!acc[date]) acc[date] = { sales: 0, orders: 0 }
      acc[date].sales += Number(o.totalAmount)
      acc[date].orders += 1
      return acc
    }, {})

    const result: SalesDataPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        sales: byDate[dateStr]?.sales ?? 0,
        orders: byDate[dateStr]?.orders ?? 0,
      })
    }

    return result
  }

  async getPopularItems(tenantId: string, limit = 10): Promise<PopularItem[]> {
    const results = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { tenantId, status: { notIn: ['CANCELLED'] } } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: results.map((r) => r.menuItemId) } },
      select: { id: true, name: true, imageUrl: true },
    })

    const itemMap = new Map(menuItems.map((m) => [m.id, m]))

    return results
      .map((r) => {
        const item = itemMap.get(r.menuItemId)
        return item
          ? {
              menuItemId: r.menuItemId,
              name: item.name,
              imageUrl: item.imageUrl,
              totalOrdered: r._sum.quantity ?? 0,
              totalRevenue: Number(r._sum.totalPrice ?? 0),
            }
          : null
      })
      .filter(Boolean) as PopularItem[]
  }
}
