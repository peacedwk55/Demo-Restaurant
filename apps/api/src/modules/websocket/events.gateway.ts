import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { WS_EVENTS } from '@tableflow/types'

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server
  private readonly logger = new Logger(EventsGateway.name)

  afterInit() {
    this.logger.log('WebSocket Gateway initialized')
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`)
  }

  // ─── Client → Server ───

  @SubscribeMessage(WS_EVENTS.JOIN_RESTAURANT)
  handleJoinRestaurant(@ConnectedSocket() client: Socket, @MessageBody() data: { tenantId: string }) {
    const room = `restaurant:${data.tenantId}`
    client.join(room)
    this.logger.debug(`Socket ${client.id} joined ${room}`)
  }

  @SubscribeMessage(WS_EVENTS.JOIN_TABLE)
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; tableId: string }
  ) {
    const room = `table:${data.tenantId}:${data.tableId}`
    client.join(room)
    this.logger.debug(`Socket ${client.id} joined ${room}`)
  }

  @SubscribeMessage(WS_EVENTS.LEAVE_TABLE)
  handleLeaveTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; tableId: string }
  ) {
    const room = `table:${data.tenantId}:${data.tableId}`
    client.leave(room)
  }

  // ─── Server → Client helpers ───

  emitToRestaurant(tenantId: string, event: string, payload: unknown) {
    this.server.to(`restaurant:${tenantId}`).emit(event, payload)
  }

  emitToTable(tenantId: string, tableId: string, event: string, payload: unknown) {
    this.server.to(`table:${tenantId}:${tableId}`).emit(event, payload)
  }
}
