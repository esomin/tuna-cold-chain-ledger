import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { Product } from '../entities/Product';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SensorRawLog } from './schemas/sensor-raw-log.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        @InjectRepository(PurchaseOrder)
        private poRepository: Repository<PurchaseOrder>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectModel(SensorRawLog.name)
        private sensorLogModel: Model<SensorRawLog>,
        private auditLogsService: AuditLogsService,
        private blockchainService: BlockchainService,
    ) { }

    private generatePoNumber(): string {
        return 'PO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    async create(createDto: CreatePurchaseOrderDto) {
        const product = await this.productRepository.findOne({ where: { sku: createDto.skuId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const po = new PurchaseOrder();
        po.poNumber = this.generatePoNumber();
        po.quantity = createDto.quantity;
        po.status = 'DRAFT';
        po.supplierName = createDto.supplierName || '';
        po.notes = createDto.notes || '';
        po.product = product;

        const savedPo = await this.poRepository.save(po);

        // 1. 발주 정보의 Keccak256 해시 연산
        const rawData = `${savedPo.poNumber}:${product.sku}:${savedPo.quantity}:DRAFT`;
        const dataHash = ethers.keccak256(ethers.toUtf8Bytes(rawData));

        // 2. 스마트 계약 온체인 등록 (최초 어획 단계)
        const txHash = await this.blockchainService.registerCheckpoint(
            savedPo.poNumber,
            dataHash,
            'HARVESTED'
        );

        // 3. 감사 로그 적재
        await this.auditLogsService.logAction(
            'CREATE_PO_HARVESTED',
            dataHash,
            txHash
        );

        return savedPo;
    }

    async findAll() {
        return this.poRepository.find({
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const po = await this.poRepository.findOne({
            where: { id: id },
            relations: ['product'],
        });
        if (!po) throw new NotFoundException('Purchase Order not found');
        return po;
    }

    async update(id: string, updateDto: UpdatePurchaseOrderDto) {
        const po = await this.findOne(id);

        const oldStatus = po.status;
        if (updateDto.status) po.status = updateDto.status;
        if (updateDto.quantity) po.quantity = updateDto.quantity;
        if (updateDto.notes) po.notes = updateDto.notes;

        const savedPo = await this.poRepository.save(po);

        // 상태값 업데이트 시 블록체인 및 감사 로그 동기화
        if (updateDto.status && oldStatus !== updateDto.status) {
            const checkpointId = `${savedPo.poNumber}-${updateDto.status}`;
            const rawData = `${savedPo.poNumber}:${updateDto.status}:${new Date().toISOString()}`;
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(rawData));

            // 스마트 계약 온체인 등록
            const txHash = await this.blockchainService.registerCheckpoint(
                checkpointId,
                dataHash,
                updateDto.status
            );

            // 감사 로그 적재
            await this.auditLogsService.logAction(
                `UPDATE_PO_STATUS_${updateDto.status}`,
                dataHash,
                txHash
            );
        }

        return savedPo;
    }

    // 실시간 로그 저장 함수
    async recordSensorLog(poNumber: string, temp: number, lat: number, lng: number) {
        const newLog = new this.sensorLogModel({
            poNumber,
            temperature: temp,
            latitude: lat,
            longitude: lng,
        });
        return await newLog.save();
    }
}
