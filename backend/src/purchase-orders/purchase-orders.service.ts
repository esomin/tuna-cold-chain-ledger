import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { Product } from '../entities/Product';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        @InjectRepository(PurchaseOrder)
        private poRepository: Repository<PurchaseOrder>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private auditLogsService: AuditLogsService,
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

        await this.auditLogsService.logAction(
            'CREATE_PO',
            '0x' + '0'.repeat(64),
            '0x' + '0'.repeat(64)
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

        if (updateDto.status) po.status = updateDto.status;
        if (updateDto.quantity) po.quantity = updateDto.quantity;
        if (updateDto.notes) po.notes = updateDto.notes;

        const savedPo = await this.poRepository.save(po);

        await this.auditLogsService.logAction(
            'UPDATE_PO',
            '0x' + '0'.repeat(64),
            '0x' + '0'.repeat(64)
        );

        return savedPo;
    }
}
