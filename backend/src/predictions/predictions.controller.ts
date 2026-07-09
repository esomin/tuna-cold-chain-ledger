import { Controller, Get, Param, Query } from '@nestjs/common';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
    constructor(private readonly predictionsService: PredictionsService) { }

    @Get('anomalies')
    getAnomalies(@Query('skuId') skuId: string) {
        return this.predictionsService.findAnomalies(skuId);
    }

    @Get(':skuId')
    getPredictions(@Param('skuId') skuId: string) {
        return this.predictionsService.findBySku(skuId);
    }
}
