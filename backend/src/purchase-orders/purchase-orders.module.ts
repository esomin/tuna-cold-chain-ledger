import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { Product } from '../entities/Product';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SensorRawLog, SensorRawLogSchema } from './schemas/sensor-raw-log.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([PurchaseOrder, Product]),
        AuditLogsModule,
        MongooseModule.forFeature([
            { name: SensorRawLog.name, schema: SensorRawLogSchema },
        ]),
    ],
    controllers: [PurchaseOrdersController],
    providers: [PurchaseOrdersService],
    exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule { }
