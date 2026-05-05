import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ReviewService } from './review.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '@tableflow/types'
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator'

class CreateReviewDto {
  @IsNumber() @Min(1) @Max(5) rating!: number
  @IsOptional() @IsString() emoji?: string
  @IsOptional() @IsString() comment?: string
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Post('public/:tenantSlug/reviews/:orderId')
  createReview(
    @Param('tenantSlug') tenantSlug: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateReviewDto
  ) {
    return this.reviewService.createReview(tenantSlug, orderId, dto)
  }

  @Get('admin/reviews')
  @Roles('OWNER', 'ADMIN')
  getReviews(@CurrentUser() user: JwtPayload) {
    return this.reviewService.getReviews(user.tenantId)
  }

  @Get('admin/reviews/stats')
  @Roles('OWNER', 'ADMIN')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.reviewService.getReviewStats(user.tenantId)
  }
}
