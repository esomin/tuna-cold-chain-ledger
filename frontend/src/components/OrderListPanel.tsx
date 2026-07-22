import React, { useEffect, useState } from 'react';

interface PurchaseOrder {
    id: string;
    poNumber: string;
    quantity: number;
    status: string;
    supplierName: string;
    notes: string;
    product: {
        sku: string;
        name: string;
    };
}

interface OrderListPanelProps {
    selectedPoId: string | null;
    onSelectPo: (po: PurchaseOrder) => void;
}

export const OrderListPanel: React.FC<OrderListPanelProps> = ({ selectedPoId, onSelectPo }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/purchase-orders`);
                if (!response.ok) {
                    throw new Error('Failed to fetch purchase orders');
                }
                const data = await response.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message || 'Error loading orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 font-bold';
            case 'PENDING':
                return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-bold';
            case 'DRAFT':
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                운송 목록을 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-rose-400 text-sm bg-rose-500/10 rounded-lg border border-rose-500/20">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-cream)' }}>운송 목록 피드</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {orders.map((order) => {
                    const isSelected = selectedPoId === order.id;
                    return (
                        <div
                            key={order.id}
                            onClick={() => onSelectPo(order)}
                            className="p-4 rounded-xl transition-all duration-200 cursor-pointer"
                            style={{
                                backgroundColor: isSelected ? '#18191a' : 'var(--theme-card-inner-bg)',
                                border: 'none',
                                boxShadow: isSelected ? 'inset 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none'
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--theme-cream)' }}>
                                    {order.poNumber}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="text-xs space-y-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}>
                                <p className="font-medium" style={{ color: 'var(--theme-cream)' }}>{order.product.name}</p>
                                <p>수량: {order.quantity}kg | 공급사: {order.supplierName}</p>
                                <p className="text-[10px] mt-1 italic line-clamp-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>{order.notes}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
