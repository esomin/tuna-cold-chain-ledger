import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Product } from './Product';

@Entity('purchase_orders')
@Index('idx_purchase_orders_sku', ['product'])
@Index('idx_purchase_orders_status', ['status'])
@Check('quantity > 0')
export class PurchaseOrder extends BaseEntity {
    @Column({ name: 'po_number', unique: true })
    poNumber: string;

    @Column({ name: 'sku_id' })
    skuId: string;

    @ManyToOne(() => Product, (product) => product.purchaseOrders)
    @JoinColumn({ name: 'sku_id' })
    product: Product;

    @Column('int')
    quantity: number;

    @Column()
    status: string; // DRAFT, PENDING, APPROVED, REJECTED, COMPLETED

    @Column({ name: 'supplier_name', nullable: true })
    supplierName: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
