import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateMenuItemDto, UpdateMenuItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto'
import { MenuDto } from '@tableflow/types'

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicMenu(tenantSlug: string): Promise<MenuDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant || !tenant.isActive) throw new NotFoundException('Restaurant not found')

    const [categories, items] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuItem.findMany({
        where: { tenantId: tenant.id, isAvailable: true },
        include: {
          optionGroups: {
            orderBy: { sortOrder: 'asc' },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const itemCountByCategory = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.categoryId] = (acc[item.categoryId] ?? 0) + 1
      return acc
    }, {})

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        bannerUrl: tenant.bannerUrl,
        primaryColor: tenant.primaryColor,
        currency: tenant.currency,
        timezone: tenant.timezone,
        googleMapsUrl: tenant.googleMapsUrl,
      },
      categories: categories
        .filter((c) => (itemCountByCategory[c.id] ?? 0) > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          icon: c.icon,
          imageUrl: c.imageUrl,
          sortOrder: c.sortOrder,
          itemCount: itemCountByCategory[c.id] ?? 0,
        })),
      items: items.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        nameEn: item.nameEn,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isPopular: item.isPopular,
        isNew: item.isNew,
        preparationTime: item.preparationTime,
        calories: item.calories,
        sortOrder: item.sortOrder,
        optionGroups: item.optionGroups.map((og) => ({
          id: og.id,
          name: og.name,
          nameEn: og.nameEn,
          type: og.type,
          required: og.required,
          minSelect: og.minSelect,
          maxSelect: og.maxSelect,
          sortOrder: og.sortOrder,
          options: og.options.map((o) => ({
            id: o.id,
            name: o.name,
            nameEn: o.nameEn,
            priceAdjust: Number(o.priceAdjust),
            isDefault: o.isDefault,
            sortOrder: o.sortOrder,
          })),
        })),
      })),
    }
  }

  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { menuItems: true } } },
    })
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { tenantId, ...dto } })
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.assertCategoryOwner(tenantId, id)
    return this.prisma.category.update({ where: { id }, data: dto })
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.assertCategoryOwner(tenantId, id)
    return this.prisma.category.delete({ where: { id } })
  }

  async getItems(tenantId: string) {
    return this.prisma.menuItem.findMany({
      where: { tenantId },
      include: { category: true, optionGroups: { include: { options: true } } },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    })
  }

  async createItem(tenantId: string, dto: CreateMenuItemDto) {
    const { optionGroups, ...itemData } = dto
    return this.prisma.menuItem.create({
      data: {
        tenantId,
        ...itemData,
        optionGroups: optionGroups
          ? {
              create: optionGroups.map((og) => ({
                name: og.name,
                nameEn: og.nameEn,
                type: og.type,
                required: og.required ?? false,
                maxSelect: og.maxSelect ?? 1,
                options: { create: og.options },
              })),
            }
          : undefined,
      },
      include: { optionGroups: { include: { options: true } } },
    })
  }

  async updateItem(tenantId: string, id: string, dto: UpdateMenuItemDto) {
    await this.assertItemOwner(tenantId, id)
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { optionGroups: { include: { options: true } } },
    })
  }

  async deleteItem(tenantId: string, id: string) {
    await this.assertItemOwner(tenantId, id)
    return this.prisma.menuItem.delete({ where: { id } })
  }

  async toggleItemAvailability(tenantId: string, id: string) {
    const item = await this.assertItemOwner(tenantId, id)
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    })
  }

  private async assertCategoryOwner(tenantId: string, id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } })
    if (!cat || cat.tenantId !== tenantId) throw new NotFoundException('Category not found')
    return cat
  }

  private async assertItemOwner(tenantId: string, id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } })
    if (!item || item.tenantId !== tenantId) throw new NotFoundException('Item not found')
    return item
  }
}
