import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EventsGateway } from '../websocket/events.gateway'
import { PaymentMethod, WS_EVENTS } from '@tableflow/types'

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway
  ) {}

  async getOrCreatePayment(tenantSlug: string, orderId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) throw new NotFoundException('Restaurant not found')

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })
    if (!order || order.tenantId !== tenant.id) throw new NotFoundException('Order not found')

    if (order.payment) {
      return this.toDto(order.payment)
    }

    // Generate PromptPay QR placeholder (in production, integrate with payment provider)
    const promptPayQrUrl = tenant.promptPayId
      ? `https://promptpay.io/${tenant.promptPayId}/${order.totalAmount}.png`
      : null

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        tenantId: tenant.id,
        amount: order.totalAmount,
        method: 'PROMPTPAY',
        status: 'PENDING',
        promptPayQrUrl,
      },
    })

    // Emit payment request to cashier
    this.events.emitToRestaurant(tenant.id, WS_EVENTS.PAYMENT_REQUESTED, {
      orderId,
      tableCode: (order as any).tableCode ?? '',
      tableName: '',
      amount: Number(order.totalAmount),
      tenantId: tenant.id,
    })

    return this.toDto(payment)
  }

  async confirmPayment(tenantId: string, orderId: string, method: PaymentMethod, transactionRef?: string, confirmedBy?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } })
    if (!payment || payment.tenantId !== tenantId) throw new NotFoundException('Payment not found')
    if (payment.status === 'CONFIRMED') throw new BadRequestException('Payment already confirmed')

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CONFIRMED',
        method,
        transactionRef,
        confirmedBy,
        confirmedAt: new Date(),
      },
    })

    // Mark order as served and table as available
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { table: true } })
    if (order) {
      await Promise.all([
        this.prisma.order.update({ where: { id: orderId }, data: { status: 'SERVED' } }),
        this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'AVAILABLE' } }),
      ])

      this.events.emitToRestaurant(tenantId, WS_EVENTS.PAYMENT_CONFIRMED, { orderId, tenantId })
      this.events.emitToTable(tenantId, order.tableId, WS_EVENTS.PAYMENT_CONFIRMED, { orderId, tenantId })
      this.events.emitToRestaurant(tenantId, WS_EVENTS.TABLE_UPDATED, {
        tableId: order.tableId,
        code: (order as any).table?.code ?? '',
        status: 'AVAILABLE',
        tenantId,
      })
    }

    return this.toDto(updated)
  }

  async getPaymentByOrder(tenantId: string, orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } })
    if (!payment || payment.tenantId !== tenantId) throw new NotFoundException('Payment not found')
    return this.toDto(payment)
  }

  private toDto(payment: any) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      promptPayQrUrl: payment.promptPayQrUrl,
      transactionRef: payment.transactionRef,
      confirmedAt: payment.confirmedAt?.toISOString() ?? null,
    }
  }
}
