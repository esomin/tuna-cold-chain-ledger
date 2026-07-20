import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
    imports: [PurchaseOrdersModule],
    providers: [WebsocketGateway],
    exports: [WebsocketGateway],
})
export class WebsocketModule { }
