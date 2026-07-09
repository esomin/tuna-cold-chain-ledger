import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { Product } from '../entities/Product';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PurchaseOrder, Product]),
        UsersModule,
    ],
    controllers: [PurchaseOrdersController],
    providers: [PurchaseOrdersService],
    exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule { }
