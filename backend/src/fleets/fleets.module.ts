import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fleet } from '../entities/Fleet';
import { FleetsService } from './fleets.service';
import { FleetsController } from './fleets.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Fleet])],
    controllers: [FleetsController],
    providers: [FleetsService],
    exports: [FleetsService],
})
export class FleetsModule {}
