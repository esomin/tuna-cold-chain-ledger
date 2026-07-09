import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkuService } from './sku.service';
import { SkuFilterDto } from './dto/sku-filter.dto';

@Controller('skus')
export class SkuController {
    constructor(private readonly skuService: SkuService) { }

    @Get()
    findAll(@Query() filterDto: SkuFilterDto) {
        return this.skuService.findAll(filterDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.skuService.findOne(id);
    }
}
