import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fleet } from '../entities/Fleet';

@Injectable()
export class FleetsService implements OnModuleInit {
  private readonly logger = new Logger(FleetsService.name);

  constructor(
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultFleets();
  }

  private async seedDefaultFleets() {
    try {
      await this.fleetRepository.query(`
                CREATE TABLE IF NOT EXISTS "fleets" (
                    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    "code" varchar NOT NULL UNIQUE,
                    "name" varchar NOT NULL,
                    "ko_name" varchar NOT NULL UNIQUE,
                    "home_port" varchar NOT NULL,
                    "latitude" double precision NOT NULL DEFAULT 35.0784,
                    "longitude" double precision NOT NULL DEFAULT 129.0069,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now()
                );
                ALTER TABLE "fleets" ADD COLUMN IF NOT EXISTS "latitude" double precision NOT NULL DEFAULT 35.0784;
                ALTER TABLE "fleets" ADD COLUMN IF NOT EXISTS "longitude" double precision NOT NULL DEFAULT 129.0069;
            `);

      const defaultFleets = [
        {
          code: 'PC7',
          name: 'Pacific Ocean Fleet No. 7',
          koName: '남태평양 원양선단 1팀',
          homePort: '부산항 감천항만',
          latitude: 35.0784,
          longitude: 129.0069,
        },
        {
          code: 'PF12',
          name: 'Pacific Ocean Fleet No. 12',
          koName: '태평양 원양선단 2팀',
          homePort: '인천항 제3부두',
          latitude: 37.4645,
          longitude: 126.6173,
        },
        {
          code: 'NP3',
          name: 'North Pacific Ocean Fleet No. 3',
          koName: '북서태평양 원양선단 3팀',
          homePort: '포항 구룡포항',
          latitude: 35.9892,
          longitude: 129.5541,
        },
      ];

      for (const fleetData of defaultFleets) {
        const existing = await this.fleetRepository.findOne({
          where: { code: fleetData.code },
        });
        if (existing) {
          existing.latitude = fleetData.latitude;
          existing.longitude = fleetData.longitude;
          existing.homePort = fleetData.homePort;
          existing.name = fleetData.name;
          existing.koName = fleetData.koName;
          await this.fleetRepository.save(existing);
        } else {
          const fleet = this.fleetRepository.create(fleetData);
          await this.fleetRepository.save(fleet);
        }
      }
      this.logger.log('Synchronized default fishing fleets with coordinates.');
    } catch (error) {
      this.logger.error('Failed to seed default fleets:', error);
    }
  }

  async findAll(): Promise<Fleet[]> {
    return this.fleetRepository.find({
      order: {
        code: 'ASC',
      },
    });
  }

  async findByKoName(koName: string): Promise<Fleet | null> {
    return this.fleetRepository.findOne({ where: { koName } });
  }
}
