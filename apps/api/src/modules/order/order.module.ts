import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [WebsocketModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
