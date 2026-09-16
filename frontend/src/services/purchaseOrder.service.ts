import api from '../config/api';

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    skuId: string;
    productId: string;
    productName: string;
    quantity: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    requestedBy?: {
        id: string;
        name: string;
    };
    approvedBy?: {
        id: string;
        name: string;
    };
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderFilterParams {
    status?: string;
    page?: number;
    limit?: number;
}

export interface CreatePurchaseOrderDto {
    skuId: string;
    quantity: number;
    notes?: string;
}

export interface UpdatePurchaseOrderDto {
    status?: string;
    notes?: string;
    quantity?: number;
}



export const getPurchaseOrders = async (params: PurchaseOrderFilterParams) => {
    const response = await api.get('/purchase-orders', { params });
    // Assuming backend returns { items: [], total: 0 } or similar wrapper
    // For now, if it returns array directly, wrap it.
    // Based on backend implementation: return this.poRepository.findAndCount()
    // It returns [PurchaseOrder[], number]
    // So response.data should be [items, total]
    if (Array.isArray(response.data) && response.data.length === 2 && Array.isArray(response.data[0]) && typeof response.data[1] === 'number') {
        return {
            items: response.data[0],
            total: response.data[1]
        };
    }
    return { items: [], total: 0 };
};

export const getPurchaseOrder = async (id: string) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
};

export const createPurchaseOrder = async (data: CreatePurchaseOrderDto) => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
};

export const updatePurchaseOrder = async (id: string, data: UpdatePurchaseOrderDto) => {
    const response = await api.patch(`/purchase-orders/${id}`, data);
    return response.data;
};

export const deletePurchaseOrder = async (id: string) => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
};
