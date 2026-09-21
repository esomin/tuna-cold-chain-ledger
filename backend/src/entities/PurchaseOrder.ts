import { Entity, Column, ManyToOne, JoinColumn, Index, Check, AfterLoad } from 'typeorm';
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
  supplierName: string; // Default English: e.g. Busan Harbor Logistics

  @Column({ name: 'supplier_name_ko', nullable: true })
  supplierNameKo: string; // Korean: e.g. 부산 어항 물류

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Compatibility aliases
  supplier_name: string;
  supplier_name_ko: string;
  supplier_name_en: string;
  supplierNameEn: string;

  @AfterLoad()
  populateSupplierAliases() {
    this.supplier_name = this.supplierName || '';
    this.supplier_name_ko = this.supplierNameKo || '';
    this.supplier_name_en = this.supplierName || '';
    this.supplierNameEn = this.supplierName || '';
  }
}
