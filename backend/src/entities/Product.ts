import { Entity, Column, OneToMany, AfterLoad } from 'typeorm';
import { BaseEntitySoftDelete } from './BaseEntity';
import { PurchaseOrder } from './PurchaseOrder';

@Entity('products')
export class Product extends BaseEntitySoftDelete {
  @Column({ unique: true })
  sku: string;

  @Column()
  name: string; // Default English

  @Column({ name: 'name_ko', default: '' })
  nameKo: string; // Korean

  @Column({ nullable: true })
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  // Relations
  @OneToMany(() => PurchaseOrder, (po) => po.product)
  purchaseOrders: PurchaseOrder[];

  // Compatibility aliases
  name_ko: string;
  name_en: string;
  nameEn: string;

  @AfterLoad()
  populateAliases() {
    this.name_ko = this.nameKo || '';
    this.name_en = this.name || '';
    this.nameEn = this.name || '';
  }
}
