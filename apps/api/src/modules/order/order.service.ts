import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrderDto, UpdateOrderStatusDto, UpdateItemStatusDto } from './dto'
import { EventsGateway } from '../websocket/events.gateway'
import { OrderDto, WS_EVENTS } from '@tableflow/types'

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway
  ) {}

  async createOrder(tenantSlug: string, dto: CreateOrderDto): Promise<OrderDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) throw new NotFoundException('Restaurant not found')

    const table = await this.prisma.table.findUnique({ where: { id: dto.tableId } })
    if (!table || table.tenantId !== tenant.id) throw new NotFoundException('Table not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const orderCount = await this.prisma.order.count({
      where: { tenantId: tenant.id, createdAt: { gte: today } },
    })

    const totalAmount = dto.items.reduce((sum, item) => {
      const optionsTotal = item.options.reduce((oSum, o) => oSum + o.priceAdjust, 0)
      return sum + (item.unitPrice + optionsTotal) * item.quantity
    }, 0)

    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        tableId: dto.tableId,
        sessionCode: dto.sessionCode,
        orderNumber: orderCount + 1,
        totalAmount,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => {
            const optionsTotal = item.options.reduce((s, o) => s + o.priceAdjust, 0)
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: (item.unitPrice + optionsTotal) * item.quantity,
              notes: item.notes,
              options: {
                create: item.options.map((o) => ({
                  optionId: o.optionId,
                  name: o.name,
                  priceAdjust: o.priceAdjust,
                })),
              },
            }
          }),
        },
      },
      include: this.orderInclude(),
    })

    // Update table status
    await this.prisma.table.update({
      where: { id: dto.tableId },
      data: { status: 'OCCUPIED' },
    })

    const orderDto = this.toDto(order)

    // Broadcast to kitchen/cashier
    this.events.emitToRestaurant(tenant.id, WS_EVENTS.ORDER_NEW, {
      order: orderDto,
      tenantId: tenant.id,
    })

    // Broadcast table update
    this.events.emitToRestaurant(tenant.id, WS_EVENTS.TABLE_UPDATED, {
      tableId: table.id,
      code: table.code,
      status: 'OCCUPIED',
      tenantId: tenant.id,
    })

    return orderDto
  }

  async getOrder(tenantSlug: string, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude(),
    })
    if (!order) throw new NotFoundException('Order not found')

    const tenant = await this.prisma.tenant.findUnique({ where: { id: order.tenantId } })
    if (!tenant || tenant.slug !== tenantSlug) throw new NotFoundException('Order not found')

    return this.toDto(order)
  }

  async getOrders(tenantId: string, status?: string) {
    const where = status
      ? { tenantId, status: status as any }
      : { tenantId, status: { notIn: ['CANCELLED', 'SERVED'] as any[] } }

    const orders = await this.prisma.order.findMany({
      where,
      include: this.orderInclude(),
      orderBy: { createdAt: 'desc' },
    })

    return orders.map((o) => this.toDto(o))
  }

  async updateOrderStatus(tenantId: string, orderId: string, dto: UpdateOrderStatusDto): Promise<OrderDto> {
    const order = await this.assertOrderOwner(tenantId, orderId)

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        servedAt: dto.status === 'SERVED' ? new Date() : undefined,
      },
      include: this.orderInclude(),
    })

    if (dto.status === 'SERVED' || dto.status === 'CANCELLED') {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: dto.status === 'SERVED' ? 'PAYMENT_PENDING' : 'AVAILABLE' },
      })

      this.events.emitToRestaurant(tenantId, WS_EVENTS.TABLE_UPDATED, {
        tableId: order.tableId,
        code: order.table.code,
        status: dto.status === 'SERVED' ? 'PAYMENT_PENDING' : 'AVAILABLE',
        tenantId,
      })
    }

    const orderDto = this.toDto(updated)

    this.events.emitToRestaurant(tenantId, WS_EVENTS.ORDER_UPDATED, {
      orderId,
      status: dto.status,
      tenantId,
    })

    this.events.emitToTable(tenantId, order.tableId, WS_EVENTS.ORDER_UPDATED, {
      orderId,
      status: dto.status,
      tenantId,
    })

    return orderDto
  }

  async updateItemStatus(tenantId: string, orderId: string, itemId: string, dto: UpdateItemStatusDto) {
    await this.assertOrderOwner(tenantId, orderId)

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: dto.status },
    })
  }

  private async assertOrderOwner(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    })
    if (!order || order.tenantId !== tenantId) throw new NotFoundException('Order not found')
    return order
  }

  private orderInclude() {
    return {
      table: true,
      items: {
        include: {
          menuItem: { select: { name: true, imageUrl: true } },
          options: true,
        },
        orderBy: { createdAt: 'asc' as const },
      },
    }
  }

  private toDto(order: any): OrderDto {
    return {
      id: order.id,
      tenantId: order.tenantId,
      tableId: order.tableId,
      tableCode: order.table.code,
      tableName: order.table.name,
      sessionCode: order.sessionCode,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      items: order.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItem.name,
        menuItemImage: item.menuItem.imageUrl,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        notes: item.notes,
        status: item.status,
        options: item.options.map((o: any) => ({
          id: o.id,
          name: o.name,
          priceAdjust: Number(o.priceAdjust),
        })),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
  }
}
