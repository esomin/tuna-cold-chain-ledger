import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('fleets')
@Index('idx_fleets_code', ['code'], { unique: true })
@Index('idx_fleets_ko_name', ['koName'], { unique: true })
export class Fleet extends BaseEntity {
    @Column({ unique: true })
    code: string; // e.g. PC7, PF12, NP3

    @Column()
    name: string; // e.g. Pacific Ocean Fleet No. 7

    @Column({ name: 'ko_name', unique: true })
    koName: string; // e.g. 남태평양 원양선단 1팀

    @Column({ name: 'home_port' })
    homePort: string; // e.g. 부산항 감천항만

    @Column({ type: 'double precision', default: 35.0784 })
    latitude: number; // e.g. 35.0784

    @Column({ type: 'double precision', default: 129.0069 })
    longitude: number; // e.g. 129.0069
}


