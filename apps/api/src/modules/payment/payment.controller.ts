import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload, PaymentMethod } from '@tableflow/types'
import { IsString, IsOptional, IsEnum } from 'class-validator'

class ConfirmPaymentDto {
  @IsEnum(['PROMPTPAY', 'CASH', 'CREDIT_CARD', 'STRIPE'])
  method!: PaymentMethod

  @IsOptional() @IsString() transactionRef?: string
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('public/:tenantSlug/payments/:orderId')
  getOrCreatePayment(@Param('tenantSlug') tenantSlug: string, @Param('orderId') orderId: string) {
    return this.paymentService.getOrCreatePayment(tenantSlug, orderId)
  }

  @Post('admin/payments/:orderId/confirm')
  @Roles('OWNER', 'ADMIN', 'CASHIER')
  confirmPayment(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmPaymentDto
  ) {
    return this.paymentService.confirmPayment(user.tenantId, orderId, dto.method, dto.transactionRef, user.sub)
  }

  @Get('admin/payments/:orderId')
  @Roles('OWNER', 'ADMIN', 'CASHIER')
  getPayment(@CurrentUser() user: JwtPayload, @Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrder(user.tenantId, orderId)
  }
}
