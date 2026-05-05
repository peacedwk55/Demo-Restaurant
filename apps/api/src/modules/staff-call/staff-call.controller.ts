import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { StaffCallService } from './staff-call.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload, StaffCallType } from '@tableflow/types'
import { IsEnum, IsOptional, IsString } from 'class-validator'

class CreateStaffCallDto {
  @IsEnum(['ASSISTANCE', 'PAYMENT', 'WATER', 'CUSTOM']) type!: StaffCallType
  @IsOptional() @IsString() message?: string
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffCallController {
  constructor(private readonly staffCallService: StaffCallService) {}

  @Public()
  @Post('public/:tenantSlug/orders/:orderId/staff-call')
  createCall(
    @Param('tenantSlug') tenantSlug: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateStaffCallDto
  ) {
    return this.staffCallService.createCall(tenantSlug, orderId, dto.type, dto.message)
  }

  @Get('admin/staff-calls/pending')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'KITCHEN')
  getPendingCalls(@CurrentUser() user: JwtPayload) {
    return this.staffCallService.getPendingCalls(user.tenantId)
  }

  @Patch('admin/staff-calls/:callId/resolve')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'KITCHEN')
  resolveCall(@CurrentUser() user: JwtPayload, @Param('callId') callId: string) {
    return this.staffCallService.resolveCall(user.tenantId, callId)
  }
}
