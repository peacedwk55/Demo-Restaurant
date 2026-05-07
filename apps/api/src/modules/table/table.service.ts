import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EventsGateway } from '../websocket/events.gateway'
import { TableStatus, WS_EVENTS } from '@tableflow/types'

export class CreateTableDto {
  code!: string
  name!: string
  capacity?: number
  zone?: string
}

export class UpdateTableStatusDto {
  status!: TableStatus
}

@Injectable()
export class TableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway
  ) {}

  async getTables(tenantId: string) {
    const tables = await this.prisma.table.findMany({
      where: { tenantId, isActive: true },
      include: {
        orders: {
          where: { status: { notIn: ['CANCELLED', 'SERVED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { items: { include: { menuItem: true, options: true } } },
        },
      },
      orderBy: [{ zone: 'asc' }, { code: 'asc' }],
    })

    return tables.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      capacity: t.capacity,
      zone: t.zone,
      status: t.status,
      qrCodeUrl: t.qrCodeUrl,
      currentOrder: t.orders[0] ?? null,
    }))
  }

  async getTableByCode(tenantSlug: string, tableCode: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) throw new NotFoundException('Restaurant not found')

    const table = await this.prisma.table.findUnique({
      where: { tenantId_code: { tenantId: tenant.id, code: tableCode.toUpperCase() } },
    })
    if (!table || !table.isActive) throw new NotFoundException('Table not found')

    return {
      id: table.id,
      code: table.code,
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      status: table.status,
      qrCodeUrl: table.qrCodeUrl,
    }
  }

  async createTable(tenantId: string, dto: CreateTableDto) {
    return this.prisma.table.create({
      data: {
        tenantId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        capacity: dto.capacity ?? 4,
        zone: dto.zone,
      },
    })
  }

  async updateTableStatus(tenantId: string, tableId: string, dto: UpdateTableStatusDto) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } })
    if (!table || table.tenantId !== tenantId) throw new NotFoundException('Table not found')

    const updated = await this.prisma.table.update({
      where: { id: tableId },
      data: { status: dto.status },
    })

    this.events.emitToRestaurant(tenantId, WS_EVENTS.TABLE_UPDATED, {
      tableId: updated.id,
      code: updated.code,
      status: updated.status,
      tenantId,
    })

    return updated
  }

  async clearTable(tenantId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } })
    if (!table || table.tenantId !== tenantId) throw new NotFoundException('Table not found')

    const activeOrders = await this.prisma.order.findMany({
      where: { tableId, status: { notIn: ['SERVED', 'CANCELLED'] } },
      select: { id: true },
    })

    if (activeOrders.length > 0) {
      await this.prisma.order.updateMany({
        where: { id: { in: activeOrders.map((o) => o.id) } },
        data: { status: 'CANCELLED' },
      })
      for (const order of activeOrders) {
        this.events.emitToRestaurant(tenantId, WS_EVENTS.ORDER_UPDATED, {
          orderId: order.id,
          status: 'CANCELLED',
          tenantId,
        })
      }
    }

    return this.prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    })
  }

  async swapTables(tenantId: string, tableIdA: string, tableIdB: string) {
    const [tableA, tableB] = await Promise.all([
      this.prisma.table.findUnique({ where: { id: tableIdA } }),
      this.prisma.table.findUnique({ where: { id: tableIdB } }),
    ])
    if (!tableA || tableA.tenantId !== tenantId) throw new NotFoundException('Table A not found')
    if (!tableB || tableB.tenantId !== tenantId) throw new NotFoundException('Table B not found')

    // Collect order IDs first so we can swap without a 3-way conflict
    const [ordersA, ordersB] = await Promise.all([
      this.prisma.order.findMany({ where: { tableId: tableIdA, status: { notIn: ['SERVED', 'CANCELLED'] } }, select: { id: true } }),
      this.prisma.order.findMany({ where: { tableId: tableIdB, status: { notIn: ['SERVED', 'CANCELLED'] } }, select: { id: true } }),
    ])

    const idsA = ordersA.map((o) => o.id)
    const idsB = ordersB.map((o) => o.id)

    await this.prisma.$transaction([
      ...(idsA.length ? [this.prisma.order.updateMany({ where: { id: { in: idsA } }, data: { tableId: tableIdB } })] : []),
      ...(idsB.length ? [this.prisma.order.updateMany({ where: { id: { in: idsB } }, data: { tableId: tableIdA } })] : []),
      this.prisma.table.update({ where: { id: tableIdA }, data: { status: tableB.status } }),
      this.prisma.table.update({ where: { id: tableIdB }, data: { status: tableA.status } }),
    ])

    this.events.emitToRestaurant(tenantId, WS_EVENTS.TABLE_UPDATED, { tableId: tableIdA, code: tableA.code, status: tableB.status, tenantId })
    this.events.emitToRestaurant(tenantId, WS_EVENTS.TABLE_UPDATED, { tableId: tableIdB, code: tableB.code, status: tableA.status, tenantId })

    return { success: true }
  }
}
