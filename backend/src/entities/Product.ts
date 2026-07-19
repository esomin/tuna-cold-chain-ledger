import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntitySoftDelete } from './BaseEntity';
import { PurchaseOrder } from './PurchaseOrder';

@Entity('products')
export class Product extends BaseEntitySoftDelete {
    @Column({ unique: true })
    sku: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    category: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    // Relations
    @OneToMany(() => PurchaseOrder, (po) => po.product)
    purchaseOrders: PurchaseOrder[];
}
