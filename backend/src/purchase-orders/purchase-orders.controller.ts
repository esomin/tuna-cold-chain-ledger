import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
    constructor(private readonly poService: PurchaseOrdersService) { }

    @Post()
    create(@Body() createDto: CreatePurchaseOrderDto) {
        return this.poService.create(createDto);
    }

    @Get()
    findAll() {
        return this.poService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.poService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdatePurchaseOrderDto) {
        return this.poService.update(id, updateDto);
    }
}
