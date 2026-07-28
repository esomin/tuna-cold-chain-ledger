import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { OrderCreateModal } from './OrderCreateModal';

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
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderCreated = (newOrder: PurchaseOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        onSelectPo(newOrder);
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 font-bold';
            case 'PENDING':
                return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-bold';
            case 'DRAFT':
            case 'HARVESTED':
            default:
                return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold';
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
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-cream)' }}>운송 목록 피드</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>신규 운송 등록</span>
                </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {orders.map((order) => {
                    const isSelected = selectedPoId === order.id;
                    return (
                        <div
                            key={order.id}
                            onClick={() => onSelectPo(order)}
                            className="p-4 rounded-xl transition-all duration-200 cursor-pointer hover:border-slate-700"
                            style={{
                                backgroundColor: isSelected ? '#18191a' : 'var(--theme-card-inner-bg)',
                                border: isSelected ? '1px solid var(--theme-aqua)' : 'none',
                                boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none'
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
                                <p className="font-medium" style={{ color: 'var(--theme-cream)' }}>{order.product?.name || '참치 상품'}</p>
                                <p>수량: {order.quantity}kg | 공급사: {order.supplierName}</p>
                                <p className="text-[10px] mt-1 italic line-clamp-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>{order.notes}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 신규 발주/운송 정보 등록 모달 */}
            <OrderCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onOrderCreated={handleOrderCreated}
            />
        </div>
    );
};
