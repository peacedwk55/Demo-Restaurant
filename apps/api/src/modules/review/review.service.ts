import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(tenantSlug: string, orderId: string, dto: { rating: number; emoji?: string; comment?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) throw new NotFoundException('Restaurant not found')

    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { review: true } })
    if (!order || order.tenantId !== tenant.id) throw new NotFoundException('Order not found')
    if (order.review) throw new BadRequestException('Review already submitted')

    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5')

    const review = await this.prisma.review.create({
      data: {
        orderId,
        tenantId: tenant.id,
        rating: dto.rating,
        emoji: dto.emoji,
        comment: dto.comment,
      },
    })

    const shouldRedirectToGoogle = dto.rating >= 4 && tenant.googleMapsUrl

    return {
      id: review.id,
      rating: review.rating,
      emoji: review.emoji,
      comment: review.comment,
      redirectToGoogle: shouldRedirectToGoogle,
      googleMapsUrl: shouldRedirectToGoogle ? tenant.googleMapsUrl : null,
    }
  }

  async getReviews(tenantId: string) {
    return this.prisma.review.findMany({
      where: { tenantId },
      include: { order: { include: { table: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async getReviewStats(tenantId: string) {
    const reviews = await this.prisma.review.findMany({ where: { tenantId } })
    if (reviews.length === 0) return { avgRating: 0, total: 0, distribution: {} }

    const total = reviews.length
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / total
    const distribution = reviews.reduce<Record<number, number>>((acc, r) => {
      acc[r.rating] = (acc[r.rating] ?? 0) + 1
      return acc
    }, {})

    return { avgRating: Math.round(avgRating * 10) / 10, total, distribution }
  }
}
