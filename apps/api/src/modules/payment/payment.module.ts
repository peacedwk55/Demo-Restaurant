import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { WebhookController } from './webhook.controller'
import { XenditService } from './xendit.service'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [WebsocketModule, ConfigModule],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, XenditService],
})
export class PaymentModule {}
