import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '@tableflow/types'

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardSummary(user.tenantId)
  }

  @Get('sales')
  getSales(@CurrentUser() user: JwtPayload, @Query('days') days?: number) {
    return this.analyticsService.getSalesData(user.tenantId, days ? Number(days) : 7)
  }

  @Get('popular-items')
  getPopularItems(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    return this.analyticsService.getPopularItems(user.tenantId, limit ? Number(limit) : 10)
  }
}
