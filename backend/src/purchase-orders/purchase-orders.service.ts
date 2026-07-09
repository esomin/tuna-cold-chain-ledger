import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { Product } from '../entities/Product';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        @InjectRepository(PurchaseOrder)
        private poRepository: Repository<PurchaseOrder>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private auditLogsService: AuditLogsService,
        private notificationsService: NotificationsService,
        private usersService: UsersService,
    ) { }

    private generatePoNumber(): string {
        return 'PO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    async create(createDto: CreatePurchaseOrderDto) {
        const product = await this.productRepository.findOne({ where: { sku: createDto.skuId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const systemUser = await this.usersService.findOneByEmail('admin@example.com');
        if (!systemUser) {
            throw new NotFoundException('Default system admin user not found');
        }

        const po = this.poRepository.create({
            skuId: createDto.skuId,
            quantity: createDto.quantity,
            supplierName: createDto.supplierName,
            expectedArrivalDate: createDto.expectedArrivalDate,
            notes: createDto.notes,
            product,
            status: 'DRAFT',
            requestedBy: systemUser,
            poNumber: this.generatePoNumber(),
        });

        const savedPo = await this.poRepository.save(po);

        await this.auditLogsService.logAction(
            systemUser,
            'CREATE_PO',
            'PurchaseOrder',
            savedPo.id,
            { skuId: createDto.skuId, quantity: createDto.quantity }
        );

        return savedPo;
    }

    async findAll() {
        return this.poRepository.find({
            relations: ['product', 'requestedBy', 'approvedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const po = await this.poRepository.findOne({
            where: { id: id },
            relations: ['product', 'requestedBy', 'approvedBy'],
        });
        if (!po) throw new NotFoundException('Purchase Order not found');
        return po;
    }

    async update(id: string, updateDto: UpdatePurchaseOrderDto) {
        const po = await this.findOne(id);
        const oldStatus = po.status;

        const systemUser = await this.usersService.findOneByEmail('admin@example.com');
        if (!systemUser) {
            throw new NotFoundException('Default system admin user not found');
        }

        // Apply updates
        if (updateDto.status) {
            po.status = updateDto.status;
            if (updateDto.status === 'APPROVED' || updateDto.status === 'REJECTED') {
                po.approvedBy = systemUser;
            }
        }
        if (updateDto.quantity) po.quantity = updateDto.quantity;
        if (updateDto.notes) po.notes = updateDto.notes;

        const savedPo = await this.poRepository.save(po);

        // Audit Log
        const changes = {
            ...(oldStatus !== savedPo.status && { oldStatus, newStatus: savedPo.status }),
            ...(updateDto.quantity && { quantity: updateDto.quantity }),
        };

        if (Object.keys(changes).length > 0) {
            await this.auditLogsService.logAction(
                systemUser,
                'UPDATE_PO',
                'PurchaseOrder',
                savedPo.id,
                changes
            );
        }

        // Notification if status changed
        if (oldStatus !== savedPo.status) {
            // Notify the requester
            if (po.requestedBy) {
                await this.notificationsService.notifyStatusChange(
                    po.poNumber,
                    oldStatus,
                    savedPo.status,
                    po.requestedBy.id
                );
            }
        }

        return savedPo;
    }
}
