import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as QRCode from 'qrcode'

export interface XenditQRResult {
  qrId: string          // Xendit QR id
  referenceId: string   // our orderId
  qrImage: string       // base64 data URI png
}

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name)
  private readonly secretKey: string
  private readonly callbackToken: string

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get<string>('XENDIT_SECRET_KEY', '')
    this.callbackToken = config.get<string>('XENDIT_CALLBACK_TOKEN', '')
  }

  get isConfigured(): boolean {
    return !!(this.secretKey)
  }

  private get authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.secretKey}:`).toString('base64')
  }

  /**
   * Create PromptPay QR via Xendit QR Codes API
   * https://developers.xendit.co/api-reference/#create-qr-code
   */
  async createQR(orderId: string, amount: number): Promise<XenditQRResult> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

    const res = await fetch('https://api.xendit.co/qr_codes', {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'api-version': '2022-07-31',
      },
      body: JSON.stringify({
        reference_id: orderId,
        type: 'DYNAMIC',
        currency: 'THB',
        amount,
        expires_at: expiresAt,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      this.logger.error(`Xendit QR error: ${res.status} ${text}`)
      throw new Error(`Xendit error: ${res.status}`)
    }

    const data = await res.json() as {
      id: string
      reference_id: string
      qr_string: string
      status: string
    }

    // Convert QR string → PNG data URI using qrcode library
    const qrImage = await QRCode.toDataURL(data.qr_string, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })

    return {
      qrId: data.id,
      referenceId: data.reference_id,
      qrImage,
    }
  }

  /**
   * Verify webhook callback token from x-callback-token header
   */
  verifyWebhook(callbackToken: string): boolean {
    if (!this.callbackToken) return true // ถ้าไม่ตั้งค่าให้ผ่านไปก่อน
    return callbackToken === this.callbackToken
  }
}
