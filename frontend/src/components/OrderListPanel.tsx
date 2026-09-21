import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Truck, MoreVertical, ChevronRight, RefreshCw, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { OrderCreateModal } from './OrderCreateModal';
import { deletePurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrder.service';
import { getLocalizedProductName, getLocalizedSupplierName, type LocalizedProduct, type LocalizedSupplier } from '../utils/i18nHelper';

interface PurchaseOrder extends LocalizedSupplier {
    id: string;
    poNumber: string;
    quantity: number;
    status: string;
    supplierName: string;
    supplierNameKo?: string;
    supplierNameEn?: string;
    notes: string;
    product: LocalizedProduct;
}

interface OrderListPanelProps {
    selectedPoId: string | null;
    onSelectPo: (po: PurchaseOrder) => void;
    isLoading?: boolean;
    onErrorChange?: (errorMsg: string | null) => void;
    connectionStatus?: 'connecting' | 'connected' | 'disconnected';
}

const STAGE_ORDER: Record<string, number> = {
    HARVESTED: 0,
    DRAFT: 0,
    PROCESSING: 1,
    PROCESSED: 1,
    IN_TRANSIT: 2,
    PENDING: 2,
    DELIVERED: 3,
    COMPLETED: 3,
};

const STAGE_OPTIONS = [
    { key: 'HARVESTED', step: 1, labelKey: 'orderList.stages.harvested' },
    { key: 'PROCESSING', step: 2, labelKey: 'orderList.stages.processing' },
    { key: 'IN_TRANSIT', step: 3, labelKey: 'orderList.stages.inTransit' },
    { key: 'DELIVERED', step: 4, labelKey: 'orderList.stages.delivered' },
];

export const OrderListPanel: React.FC<OrderListPanelProps> = ({ selectedPoId, onSelectPo, isLoading, onErrorChange, connectionStatus }) => {
    const { t, i18n } = useTranslation();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [updatingStatusInfo, setUpdatingStatusInfo] = useState<{ poNumber: string; newStatus: string } | null>(null);

    const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDisconnected = connectionStatus === 'disconnected' || Boolean(error);

    const handleDeleteOrder = async (e: React.MouseEvent, poId: string) => {
        e.stopPropagation();
        if (isDisconnected) return;
        if (!window.confirm('해당 발주/운송 레코드를 DB에서 삭제하시겠습니까?')) return;
        try {
            await deletePurchaseOrder(poId);
            setOrders((prev) => {
                const updated = prev.filter((o) => o.id !== poId);
                if (selectedPoId === poId && updated.length > 0) {
                    onSelectPo(updated[0]);
                }
                return updated;
            });
        } catch (err) {
            console.error('Failed to delete purchase order', err);
            alert('삭제 처리 중 오류가 발생했습니다.');
        }
    };

    const handleUpdateStatus = async (e: React.MouseEvent, poId: string, newStatus: string) => {
        e.stopPropagation();
        if (isDisconnected) return;

        if (updatingStatusInfo) {
            alert('현재 다른 온체인 트랜잭션 서명 작업이 진행 중입니다. 잠시만 기다려주세요.');
            return;
        }

        const target = orders.find((o) => String(o.id) === String(poId));
        if (target) {
            const currentStageIndex = STAGE_ORDER[target.status.toUpperCase()] ?? 0;
            const newStageIndex = STAGE_ORDER[newStatus.toUpperCase()] ?? 0;
            if (newStageIndex < currentStageIndex) {
                alert('유통 단계는 이전(역순) 단계로 변경할 수 없습니다.');
                return;
            }
        }

        try {
            setUpdatingStatusInfo({
                poNumber: target ? target.poNumber : `PO-${poId}`,
                newStatus,
            });

            // 1. 유통 단계 변경 요청 (이더리움 서명 등 약 5~10초 소요)
            await updatePurchaseOrder(poId, { status: newStatus });

            // 2. 최신 서버 상태로 전체 리스트 갱신
            await fetchOrders();
        } catch (err: any) {
            console.error('Failed to update stage status', err);
            const errMsg = err?.response?.data?.message || err?.message || '단계 변경 중 오류가 발생했습니다.';
            alert(errMsg);
        } finally {
            setUpdatingStatusInfo(null);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/purchase-orders`);
            if (!response.ok) {
                throw new Error('Failed to fetch purchase orders');
            }
            const data: PurchaseOrder[] = await response.json();
            setOrders(data);
            setError(null);
            if (onErrorChange) onErrorChange(null);
            if (data && data.length > 0) {
                const matched = data.find((item) => String(item.id) === String(selectedPoId));
                if (matched) {
                    onSelectPo(matched);
                } else if (!selectedPoId) {
                    onSelectPo(data[0]);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch purchase orders:', err);
            const errMsg = 'Unable to connect to backend server. (NestJS backend server required)';
            setError(errMsg);
            if (onErrorChange) onErrorChange(errMsg);
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
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            case 'HARVESTED':
                return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
            case 'PROCESSING':
            case 'PROCESSED':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
            case 'IN_TRANSIT':
            case 'PENDING':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'DRAFT':
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'DELIVERED':
                return t('orderList.stages.delivered');
            case 'HARVESTED':
                return t('orderList.stages.harvested');
            case 'PROCESSING':
            case 'PROCESSED':
                return t('orderList.stages.processing');
            case 'IN_TRANSIT':
            case 'PENDING':
                return t('orderList.stages.inTransit');
            case 'DRAFT':
            default:
                return t('orderList.stages.harvested');
        }
    };

    if (loading || isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-36 bg-slate-800 rounded-md animate-pulse" />
                    <div className="h-7 w-20 bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="h-4 w-28 bg-slate-800 rounded" />
                                <div className="h-4 w-16 bg-slate-800 rounded-full" />
                            </div>
                            <div className="h-3.5 w-3/4 bg-slate-800/80 rounded" />
                            <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider font-digital truncate">{t('orderList.title')}</h3>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-digital flex flex-col items-center justify-center gap-2.5 text-center min-h-[160px]">
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                    <p className="font-semibold">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>다시 시도</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider font-digital truncate">{t('orderList.title')}</h3>
                </div>
                <button
                    disabled={isDisconnected}
                    onClick={() => setIsModalOpen(true)}
                    title={isDisconnected ? t('dashboard.labels.needServerConnection') : ''}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md font-digital shrink-0 whitespace-nowrap select-none ${
                        isDisconnected
                            ? 'bg-slate-800 text-slate-500 border border-slate-700/60 opacity-60 cursor-not-allowed'
                            : 'bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 shadow-sky-500/20'
                    }`}
                >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('orderList.newOrder')}</span>
                </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-digital glass-card-inner rounded-2xl border border-white/5">
                        <Truck className="w-8 h-8 text-slate-600 mb-2" />
                        <p className="font-semibold text-slate-300">등록된 운송 건이 없습니다</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const isSelected = selectedPoId === order.id;
                        return (
                            <div
                                key={order.id}
                                onClick={() => onSelectPo(order)}
                                className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border relative ${
                                    isSelected
                                        ? 'bg-sky-500/15 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/30'
                                        : 'glass-card-inner border-white/5 hover:border-white/20 hover:bg-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                                        {order.poNumber}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold font-digital ${getStatusBadge(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        {isDev && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu.Root>
                                                    <DropdownMenu.Trigger asChild>
                                                        <button
                                                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors outline-none"
                                                            title="관리 메뉴"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                    </DropdownMenu.Trigger>

                                                    <DropdownMenu.Portal>
                                                        <DropdownMenu.Content
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="z-[9999] min-w-[220px] rounded-2xl bg-[#182836] border border-[#2b4458] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-1.5 text-xs font-digital text-slate-100 animate-in fade-in zoom-in-95 duration-150"
                                                            sideOffset={5}
                                                            align="end"
                                                        >
                                                            <DropdownMenu.Sub>
                                                                <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-sky-500/20 text-slate-200 hover:text-sky-300 cursor-pointer outline-none transition-colors font-medium">
                                                                    <span className="flex items-center gap-2">
                                                                        <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                                                                        <span className="font-bold">유통 단계 변경</span>
                                                                    </span>
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                                                </DropdownMenu.SubTrigger>

                                                                <DropdownMenu.Portal>
                                                                    <DropdownMenu.SubContent
                                                                        className="z-[9999] min-w-[210px] rounded-2xl bg-[#14222d] border border-[#2b4458] shadow-2xl p-1.5 text-xs font-digital text-slate-100 animate-in fade-in zoom-in-95 duration-150"
                                                                        sideOffset={4}
                                                                    >
                                                                        {STAGE_OPTIONS.map((opt) => {
                                                                            const currentStageIndex = STAGE_ORDER[order.status.toUpperCase()] ?? 0;
                                                                            const optionStageIndex = STAGE_ORDER[opt.key] ?? 0;
                                                                            const isBackward = optionStageIndex < currentStageIndex;
                                                                            const isCurrent = order.status.toUpperCase() === opt.key;

                                                                            return (
                                                                                <DropdownMenu.Item
                                                                                    key={opt.key}
                                                                                    disabled={isBackward}
                                                                                    onClick={(e) => {
                                                                                        if (isBackward) return;
                                                                                        handleUpdateStatus(e, order.id, opt.key);
                                                                                    }}
                                                                                    className={`px-3 py-2 rounded-xl text-[11px] font-medium outline-none transition-colors flex items-center justify-between ${
                                                                                        isCurrent
                                                                                            ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-400/40 shadow-sm cursor-default'
                                                                                            : isBackward
                                                                                            ? 'opacity-40 text-slate-500 cursor-not-allowed select-none'
                                                                                            : 'hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer'
                                                                                    }`}
                                                                                >
                                                                                    <span>{opt.step}. {opt.key} ({t(opt.labelKey)})</span>
                                                                                    {isBackward && <span className="text-[9px] text-rose-400/80 font-normal">{t('orderList.cannotBackward')}</span>}
                                                                                </DropdownMenu.Item>
                                                                            );
                                                                        })}
                                                                    </DropdownMenu.SubContent>
                                                                </DropdownMenu.Portal>
                                                            </DropdownMenu.Sub>

                                                            <DropdownMenu.Separator className="h-[1px] bg-[#24394a] my-1" />

                                                            <DropdownMenu.Item
                                                                onClick={(e) => handleDeleteOrder(e, order.id)}
                                                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer outline-none transition-colors font-medium"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                <span>{t('orderList.deleteOrder')}</span>
                                                            </DropdownMenu.Item>
                                                        </DropdownMenu.Content>
                                                    </DropdownMenu.Portal>
                                                </DropdownMenu.Root>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs space-y-0.5 text-slate-300">
                                    <p className="font-semibold text-slate-100">{getLocalizedProductName(order.product, i18n.language) || t('dashboard.labels.tunaProduct')}</p>
                                    <p className="text-[11px] text-slate-400">{t('orderList.quantity')} <strong className="text-slate-200">{order.quantity}kg</strong> | {getLocalizedSupplierName(order, i18n.language) || order.supplierName}</p>
                                    <p className="text-[10px] text-slate-400/80 italic line-clamp-1">{order.notes}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 신규 발주/운송 정보 등록 모달 */}
            <OrderCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onOrderCreated={handleOrderCreated}
            />

            {/* 온체인 트랜잭션 진행 안내 토스트 팝업 (상단 중앙 고정 배치로 화면 배율 및 줌 환경에서도 100% 명확히 노출) */}
            {updatingStatusInfo && createPortal(
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-xl">
                    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#182836] border-2 border-sky-400/60 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(56,189,248,0.4)] text-slate-100 font-digital">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center shrink-0 shadow-inner">
                            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                        </div>
                        <div className="space-y-0.5 text-xs flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-sky-300 text-xs sm:text-sm">온체인 트랜잭션 체결 진행 중...</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-sky-400/20 text-sky-200 border border-sky-400/40 font-mono font-bold animate-pulse shrink-0">
                                    {updatingStatusInfo.newStatus}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                                <strong className="text-white font-mono">{updatingStatusInfo.poNumber}</strong> | 스마트 계약 서명 및 Keccak256 무결성 락업 생성 중
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
};
