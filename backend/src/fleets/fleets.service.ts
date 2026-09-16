import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fleet } from '../entities/Fleet';

@Injectable()
export class FleetsService implements OnModuleInit {
    private readonly logger = new Logger(FleetsService.name);

    constructor(
        @InjectRepository(Fleet)
        private readonly fleetRepository: Repository<Fleet>
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
                    "initials" varchar NOT NULL DEFAULT 'TC',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now()
                );
            `);

            const count = await this.fleetRepository.count();
            if (count === 0) {
                this.logger.log('Seeding initial fishing fleets into DB...');
                const defaultFleets = [
                    {
                        code: 'PC7',
                        name: 'Pacific Ocean Fleet No. 7',
                        koName: '남태평양 원양선단 1팀',
                        homePort: '부산항 감천항만',
                        initials: 'TC',
                    },
                    {
                        code: 'PF12',
                        name: 'Pacific Ocean Fleet No. 12',
                        koName: '태평양 원양선단 2팀',
                        homePort: '인천항 제3부두',
                        initials: 'PF',
                    },
                    {
                        code: 'NP3',
                        name: 'North Pacific Ocean Fleet No. 3',
                        koName: '북서태평양 원양선단 3팀',
                        homePort: '포항 구룡포항',
                        initials: 'NP',
                    },
                ];

                for (const fleetData of defaultFleets) {
                    const fleet = this.fleetRepository.create(fleetData);
                    await this.fleetRepository.save(fleet);
                }
                this.logger.log('Seeded 3 default fishing fleets.');
            }
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
