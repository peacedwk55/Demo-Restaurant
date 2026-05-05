import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { MenuService } from './menu.service'
import { CreateMenuItemDto, UpdateMenuItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '@tableflow/types'

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Public (customer) ───

  @Public()
  @Get('public/:tenantSlug/menu')
  getPublicMenu(@Param('tenantSlug') tenantSlug: string) {
    return this.menuService.getPublicMenu(tenantSlug)
  }

  // ─── Admin ───

  @Get('admin/menu/categories')
  @Roles('OWNER', 'ADMIN')
  getCategories(@CurrentUser() user: JwtPayload) {
    return this.menuService.getCategories(user.tenantId)
  }

  @Post('admin/menu/categories')
  @Roles('OWNER', 'ADMIN')
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(user.tenantId, dto)
  }

  @Patch('admin/menu/categories/:id')
  @Roles('OWNER', 'ADMIN')
  updateCategory(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(user.tenantId, id, dto)
  }

  @Delete('admin/menu/categories/:id')
  @Roles('OWNER', 'ADMIN')
  deleteCategory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteCategory(user.tenantId, id)
  }

  @Get('admin/menu/items')
  @Roles('OWNER', 'ADMIN', 'KITCHEN')
  getItems(@CurrentUser() user: JwtPayload) {
    return this.menuService.getItems(user.tenantId)
  }

  @Post('admin/menu/items')
  @Roles('OWNER', 'ADMIN')
  createItem(@CurrentUser() user: JwtPayload, @Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(user.tenantId, dto)
  }

  @Patch('admin/menu/items/:id')
  @Roles('OWNER', 'ADMIN')
  updateItem(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(user.tenantId, id, dto)
  }

  @Patch('admin/menu/items/:id/toggle-availability')
  @Roles('OWNER', 'ADMIN', 'KITCHEN')
  toggleAvailability(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.toggleItemAvailability(user.tenantId, id)
  }

  @Delete('admin/menu/items/:id')
  @Roles('OWNER', 'ADMIN')
  deleteItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteItem(user.tenantId, id)
  }
}
