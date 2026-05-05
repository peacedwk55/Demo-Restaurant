import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { OrderService } from './order.service'
import { CreateOrderDto, UpdateOrderStatusDto, UpdateItemStatusDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '@tableflow/types'

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Public()
  @Post('public/:tenantSlug/orders')
  createOrder(@Param('tenantSlug') tenantSlug: string, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(tenantSlug, dto)
  }

  @Public()
  @Get('public/:tenantSlug/orders/:orderId')
  getOrder(@Param('tenantSlug') tenantSlug: string, @Param('orderId') orderId: string) {
    return this.orderService.getOrder(tenantSlug, orderId)
  }

  @Get('admin/orders')
  @Roles('OWNER', 'ADMIN', 'KITCHEN', 'CASHIER')
  getOrders(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.orderService.getOrders(user.tenantId, status)
  }

  @Patch('admin/orders/:orderId/status')
  @Roles('OWNER', 'ADMIN', 'KITCHEN', 'CASHIER')
  updateOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.orderService.updateOrderStatus(user.tenantId, orderId, dto)
  }

  @Patch('admin/orders/:orderId/items/:itemId/status')
  @Roles('OWNER', 'ADMIN', 'KITCHEN')
  updateItemStatus(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemStatusDto
  ) {
    return this.orderService.updateItemStatus(user.tenantId, orderId, itemId, dto)
  }
}
