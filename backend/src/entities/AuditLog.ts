import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
    @Column()
    action: string;

    @Column({ name: 'data_hash' })
    dataHash: string;

    @Column({ name: 'tx_hash' })
    txHash: string;
}
