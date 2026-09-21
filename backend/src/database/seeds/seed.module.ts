import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrder } from '../../entities/PurchaseOrder';
import { Product } from '../../entities/Product';
import { SensorRawLog, SensorRawLogSchema } from '../../purchase-orders/schemas/sensor-raw-log.schema';
import { ScenarioSeedService } from './scenario-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, Product]),
    MongooseModule.forFeature([{ name: SensorRawLog.name, schema: SensorRawLogSchema }]),
  ],
  providers: [ScenarioSeedService],
  exports: [ScenarioSeedService],
})
export class SeedModule {}
