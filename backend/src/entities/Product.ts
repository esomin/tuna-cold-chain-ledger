import { Entity, Column, OneToMany, AfterLoad } from 'typeorm';
import { BaseEntitySoftDelete } from './BaseEntity';
import { PurchaseOrder } from './PurchaseOrder';

@Entity('products')
export class Product extends BaseEntitySoftDelete {
  @Column({ unique: true })
  sku: string;

  @Column({ name: 'name_ko', default: '' })
  nameKo: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  // Relations
  @OneToMany(() => PurchaseOrder, (po) => po.product)
  purchaseOrders: PurchaseOrder[];

  // Aliases for API responses & legacy compatibility
  name_ko: string;
  name_en: string;
  name: string;

  @AfterLoad()
  populateAliases() {
    this.name_ko = this.nameKo || '';
    this.name_en = this.nameEn || '';
    this.name = this.nameKo || this.nameEn || '';
  }
}
