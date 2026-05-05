import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { MenuModule } from './modules/menu/menu.module'
import { OrderModule } from './modules/order/order.module'
import { TableModule } from './modules/table/table.module'
import { PaymentModule } from './modules/payment/payment.module'
import { ReviewModule } from './modules/review/review.module'
import { StaffCallModule } from './modules/staff-call/staff-call.module'
import { WebsocketModule } from './modules/websocket/websocket.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    MenuModule,
    OrderModule,
    TableModule,
    PaymentModule,
    ReviewModule,
    StaffCallModule,
    WebsocketModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
