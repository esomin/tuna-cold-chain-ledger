import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { SkuModule } from './sku/sku.module';
import { PredictionsModule } from './predictions/predictions.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { MarketingModule } from './promotions/marketing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    UsersModule,
    SkuModule,
    PredictionsModule,
    PurchaseOrdersModule,
    AuditLogsModule,
    NotificationsModule,
    OrdersModule,
    InventoryModule,
    MarketingModule,
    AnalyticsModule,
  ],
})
export class AppModule { }
