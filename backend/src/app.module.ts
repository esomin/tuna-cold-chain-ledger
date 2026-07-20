import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WebsocketModule } from './websocket/websocket.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    PurchaseOrdersModule,
    AuditLogsModule,
    BlockchainModule,
    WebsocketModule,
  ],
})
export class AppModule { }
