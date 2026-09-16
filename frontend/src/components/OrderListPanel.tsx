import React, { useEffect, useState } from 'react';
import { Plus, Truck } from 'lucide-react';
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
            const data: PurchaseOrder[] = await response.json();
            setOrders(data);
            if (data && data.length > 0 && !selectedPoId) {
                onSelectPo(data[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Error loading orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (orders.length > 0 && !selectedPoId) {
            onSelectPo(orders[0]);
        }
    }, [orders, selectedPoId]);

    const handleOrderCreated = (newOrder: PurchaseOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        onSelectPo(newOrder);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'DELIVERED':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
            case 'PENDING':
            case 'IN_TRANSIT':
                return 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]';
            case 'HARVESTED':
            case 'DRAFT':
            default:
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'DELIVERED':
                return '입고 완료';
            case 'HARVESTED':
                return '어획 완료';
            case 'PROCESSING':
            case 'PROCESSED':
                return '초저온 가공';
            case 'IN_TRANSIT':
            case 'PENDING':
                return '초저온 운송중';
            case 'DRAFT':
            default:
                return '어획 완료';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2 font-digital">
                <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>운송 목록을 불러오는 중...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-rose-300 text-xs bg-rose-500/10 rounded-2xl border border-rose-500/30 font-digital">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-digital">Fleet Transport Feed</h3>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 transition-all shadow-md shadow-sky-500/20 font-digital"
                >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>신규 등록</span>
                </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {orders.map((order) => {
                    const isSelected = selectedPoId === order.id;
                    return (
                        <div
                            key={order.id}
                            onClick={() => onSelectPo(order)}
                            className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${isSelected
                                ? 'bg-sky-500/15 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/30'
                                : 'glass-card-inner border-white/5 hover:border-white/20 hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="font-mono text-xs font-bold text-white tracking-wide">
                                    {order.poNumber}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold font-digital ${getStatusBadge(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                            <div className="text-xs space-y-0.5 text-slate-300">
                                <p className="font-semibold text-slate-100">{order.product?.name || '참치 상품'}</p>
                                <p className="text-[11px] text-slate-400">수량: <strong className="text-slate-200">{order.quantity}kg</strong> | {order.supplierName}</p>
                                <p className="text-[10px] text-slate-400/80 italic line-clamp-1">{order.notes}</p>
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
