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

    return this.prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    })
  }
}
