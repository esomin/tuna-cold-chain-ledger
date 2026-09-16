import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FleetsService } from './fleets.service';
import { Fleet } from '../entities/Fleet';

@ApiTags('fleets')
@Controller('fleets')
export class FleetsController {
    constructor(private readonly fleetsService: FleetsService) {}

    @Get()
    @ApiOperation({ summary: '원양 선단 목록 조회' })
    @ApiResponse({ status: 200, description: '선단 목록 조회 성공', type: [Fleet] })
    async findAll(): Promise<Fleet[]> {
        return this.fleetsService.findAll();
    }
}
