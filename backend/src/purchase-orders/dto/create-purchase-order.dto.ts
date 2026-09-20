export class CreatePurchaseOrderDto {
  skuId: string;
  quantity: number;
  supplierName?: string;
  expectedArrivalDate?: Date;
  notes?: string;
}

export class UpdatePurchaseOrderDto {
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  quantity?: number;
  notes?: string;
}
