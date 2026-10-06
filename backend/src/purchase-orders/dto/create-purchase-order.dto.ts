export class CreatePurchaseOrderDto {
  skuId: string;
  quantity: number;
  fleetId?: string;
  fleetCode?: string;
  supplierName?: string;
  supplierNameKo?: string;
  supplierNameEn?: string;
  expectedArrivalDate?: Date;
  notes?: string;
}

export class UpdatePurchaseOrderDto {
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  quantity?: number;
  notes?: string;
}
