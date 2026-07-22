import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog';
import { ethers } from 'ethers';

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
        const logs = await this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
        });

        // DB에 시드 로그가 없는 경우 데모용 기본 온체인 이력 반환 (dataHash & txHash 모두 ethers.keccak256 동적 계산)
        if (logs.length === 0) {
            const createDataHash = (poNumber: string, sku: string, qty: number, status: string) => {
                const raw = `${poNumber}:${sku}:${qty}:${status}`;
                return ethers.keccak256(ethers.toUtf8Bytes(raw));
            };

            const createTxHash = (action: string, sequence: number) => {
                const raw = `TX_ETH_NODE_LOCAL:${action}:${sequence}`;
                return ethers.keccak256(ethers.toUtf8Bytes(raw));
            };

            return [
                {
                    id: '1',
                    action: 'CREATE_PO_HARVESTED [PO-2026-SCENARIO-A]',
                    dataHash: createDataHash('PO-2026-SCENARIO-A', 'TUNA-PREMIUM-001', 50, 'DRAFT'),
                    txHash: createTxHash('CREATE_PO_HARVESTED', 101),
                    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                },
                {
                    id: '2',
                    action: 'UPDATE_PO_STATUS_PROCESSING [PO-2026-SCENARIO-A]',
                    dataHash: createDataHash('PO-2026-SCENARIO-A', 'TUNA-PREMIUM-001', 50, 'PROCESSING'),
                    txHash: createTxHash('UPDATE_PO_STATUS_PROCESSING', 102),
                    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                },
                {
                    id: '3',
                    action: 'UPDATE_PO_STATUS_IN_TRANSIT [PO-2026-SCENARIO-B]',
                    dataHash: createDataHash('PO-2026-SCENARIO-B', 'TUNA-PREMIUM-001', 30, 'IN_TRANSIT'),
                    txHash: createTxHash('UPDATE_PO_STATUS_IN_TRANSIT', 103),
                    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                },
                {
                    id: '4',
                    action: 'UPDATE_PO_STATUS_DELIVERED [PO-2026-SCENARIO-A]',
                    dataHash: createDataHash('PO-2026-SCENARIO-A', 'TUNA-PREMIUM-001', 50, 'COMPLETED'),
                    txHash: createTxHash('UPDATE_PO_STATUS_DELIVERED', 104),
                    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
                },
            ];
        }

        return logs;
    }

    async findByAction(action: string) {
        return this.auditLogRepository.find({
            where: { action },
            order: { createdAt: 'DESC' },
        });
    }
}
