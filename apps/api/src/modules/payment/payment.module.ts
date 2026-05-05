import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [WebsocketModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
