import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EventsGateway } from '../websocket/events.gateway'
import { StaffCallType, WS_EVENTS } from '@tableflow/types'

@Injectable()
export class StaffCallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway
  ) {}

  async createCall(tenantSlug: string, orderId: string, type: StaffCallType, message?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) throw new NotFoundException('Restaurant not found')

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    })
    if (!order || order.tenantId !== tenant.id) throw new NotFoundException('Order not found')

    const call = await this.prisma.staffCall.create({
      data: { orderId, type, message },
    })

    this.events.emitToRestaurant(tenant.id, WS_EVENTS.STAFF_CALL, {
      callId: call.id,
      orderId,
      tableCode: (order as any).table.code,
      tableName: (order as any).table.name,
      type,
      message: message ?? null,
      tenantId: tenant.id,
    })

    return { id: call.id, type, message, createdAt: call.createdAt.toISOString() }
  }

  async resolveCall(tenantId: string, callId: string) {
    const call = await this.prisma.staffCall.findUnique({
      where: { id: callId },
      include: { order: true },
    })
    if (!call || call.order.tenantId !== tenantId) throw new NotFoundException('Call not found')

    return this.prisma.staffCall.update({
      where: { id: callId },
      data: { resolvedAt: new Date() },
    })
  }

  async getPendingCalls(tenantId: string) {
    return this.prisma.staffCall.findMany({
      where: { resolvedAt: null, order: { tenantId } },
      include: { order: { include: { table: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }
}
