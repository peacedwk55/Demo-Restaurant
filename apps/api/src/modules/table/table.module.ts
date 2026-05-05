import { Module } from '@nestjs/common'
import { TableController } from './table.controller'
import { TableService } from './table.service'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [WebsocketModule],
  controllers: [TableController],
  providers: [TableService],
})
export class TableModule {}
