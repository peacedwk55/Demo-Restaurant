import { Module } from '@nestjs/common'
import { StaffCallController } from './staff-call.controller'
import { StaffCallService } from './staff-call.service'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [WebsocketModule],
  controllers: [StaffCallController],
  providers: [StaffCallService],
})
export class StaffCallModule {}
