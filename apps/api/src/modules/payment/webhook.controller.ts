import { Controller, Post, Body, Headers, Logger, HttpCode } from '@nestjs/common'
import { XenditService } from './xendit.service'
import { PaymentService } from './payment.service'

interface XenditQRWebhookDto {
  event: string   // 'qr.payment'
  business_id: string
  created: string
  data: {
    id: string
    reference_id: string   // our orderId
    status: string
    currency: string
    amount: number
    qr_string: string
    channel_code: string
    payment_detail?: {
      receipt_id?: string
      source?: string
    }
  }
}

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)

  constructor(
    private readonly xenditService: XenditService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Xendit webhook — ตั้ง URL นี้ใน Xendit Dashboard → Webhooks
   * POST /api/webhooks/xendit
   */
  @Post('xendit')
  @HttpCode(200)
  async handleXendit(
    @Headers('x-callback-token') callbackToken: string,
    @Body() payload: XenditQRWebhookDto,
  ) {
    this.logger.log(`Xendit webhook: event=${payload.event} ref=${payload.data?.reference_id}`)

    // Verify callback token
    if (!this.xenditService.verifyWebhook(callbackToken)) {
      this.logger.warn('Invalid x-callback-token')
      return { ok: false, reason: 'invalid_token' }
    }

    // Only process QR payment events
    if (payload.event !== 'qr.payment') {
      return { ok: true }
    }

    const orderId = payload.data?.reference_id
    const xenditQrId = payload.data?.id

    if (!orderId) {
      this.logger.warn('No reference_id in webhook payload')
      return { ok: false, reason: 'missing_reference_id' }
    }

    try {
      await this.paymentService.confirmByWebhook(orderId, xenditQrId)
      this.logger.log(`Payment confirmed via webhook: orderId=${orderId}`)
    } catch (err: any) {
      this.logger.error(`confirmByWebhook failed: ${err.message}`)
    }

    return { ok: true }
  }
}
