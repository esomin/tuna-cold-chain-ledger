import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog';

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async logAction(action: string, dataHash: string, txHash: string) {
        const log = this.auditLogRepository.create({
            action,
            dataHash,
            txHash,
        });
        return this.auditLogRepository.save(log);
    }

    async findAll() {
        return this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findByAction(action: string) {
        return this.auditLogRepository.find({
            where: { action },
            order: { createdAt: 'DESC' },
        });
    }
}
