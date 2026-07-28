import React, { useState } from 'react';
import { X, Loader2, Send, Package, Truck, FileText } from 'lucide-react';

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

interface OrderCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderCreated: (newOrder: PurchaseOrder) => void;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({
    isOpen,
    onClose,
    onOrderCreated,
}) => {
    // 데모 편의를 위한 기본값 설정
    const [skuId, setSkuId] = useState<string>('TUNA-BLUEFIN');
    const [quantity, setQuantity] = useState<number>(150);
    const [supplierName, setSupplierName] = useState<string>('부산 어항 물류');
    const [notes, setNotes] = useState<string>('어획 직후 초저온(-55°C) 동결 및 온체인 무결성 검증건');

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/purchase-orders`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        skuId,
                        quantity: Number(quantity),
                        supplierName,
                        notes,
                    }),
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || '발주 생성 및 온체인 서명 중 오류가 발생했습니다.');
            }

            const newOrder = await response.json();
            onOrderCreated(newOrder);
            onClose();
        } catch (err: any) {
            console.error('Order creation error:', err);
            setError(err.message || '온체인 발주 등록 실패');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-800"
                style={{
                    backgroundColor: 'var(--theme-night, #0d1117)',
                    color: 'var(--theme-cream, #e6edf3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'rgba(var(--theme-aqua-rgb, 56, 189, 248), 0.2)' }}
                >
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5" style={{ color: 'var(--theme-aqua, #38bdf8)' }} />
                        <h3 className="text-base font-bold">신규 운송 / 발주 정보 등록</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    {/* SKU Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-cyan-400" />
                            상품 SKU (참치 품종)
                        </label>
                        <select
                            value={skuId}
                            onChange={(e) => setSkuId(e.target.value)}
                            disabled={submitting}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border bg-slate-900 border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="TUNA-BLUEFIN">참다랑어 (Bluefin Tuna) - Premium</option>
                            <option value="TUNA-BIGEYE">눈다랑어 (Bigeye Tuna) - Standard</option>
                            <option value="TUNA-YELLOWFIN">황다랑어 (Yellowfin Tuna) - Standard</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-cyan-400" />
                            발주 수량 (kg)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            disabled={submitting}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border bg-slate-900 border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="수량 입력 (예: 150)"
                            required
                        />
                    </div>

                    {/* Supplier */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-cyan-400" />
                            공급사 / 어항 물류지
                        </label>
                        <input
                            type="text"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            disabled={submitting}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border bg-slate-900 border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="예: 부산 어항 물류"
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            비고 (Notes)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={submitting}
                            rows={2}
                            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium border bg-slate-900 border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                            placeholder="특이사항 입력..."
                        />
                    </div>

                    {/* Submitting Banner */}
                    {submitting && (
                        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center gap-3 animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                            <div className="text-[11px] font-medium leading-tight">
                                <p className="font-bold">Sepolia 온체인 서명 및 트랜잭션 전송 중...</p>
                                <p className="text-[10px] text-cyan-500/80">Ethers.js로 Keccak256 해시 락업 체결 진행 중</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>등록 중...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>신규 등록 및 Sepolia 서명</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
