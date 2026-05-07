import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { TableService, CreateTableDto, UpdateTableStatusDto } from './table.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '@tableflow/types'

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Public()
  @Get('public/:tenantSlug/tables/:tableCode')
  getTableByCode(@Param('tenantSlug') tenantSlug: string, @Param('tableCode') tableCode: string) {
    return this.tableService.getTableByCode(tenantSlug, tableCode)
  }

  @Get('admin/tables')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'KITCHEN')
  getTables(@CurrentUser() user: JwtPayload) {
    return this.tableService.getTables(user.tenantId)
  }

  @Post('admin/tables')
  @Roles('OWNER', 'ADMIN')
  createTable(@CurrentUser() user: JwtPayload, @Body() dto: CreateTableDto) {
    return this.tableService.createTable(user.tenantId, dto)
  }

  @Patch('admin/tables/:tableId/status')
  @Roles('OWNER', 'ADMIN', 'CASHIER')
  updateTableStatus(@CurrentUser() user: JwtPayload, @Param('tableId') tableId: string, @Body() dto: UpdateTableStatusDto) {
    return this.tableService.updateTableStatus(user.tenantId, tableId, dto)
  }

  @Patch('admin/tables/:tableId/clear')
  @Roles('OWNER', 'ADMIN', 'CASHIER')
  clearTable(@CurrentUser() user: JwtPayload, @Param('tableId') tableId: string) {
    return this.tableService.clearTable(user.tenantId, tableId)
  }

  @Patch('admin/tables/:tableIdA/swap/:tableIdB')
  @Roles('OWNER', 'ADMIN', 'CASHIER')
  swapTables(
    @CurrentUser() user: JwtPayload,
    @Param('tableIdA') tableIdA: string,
    @Param('tableIdB') tableIdB: string,
  ) {
    return this.tableService.swapTables(user.tenantId, tableIdA, tableIdB)
  }
}
