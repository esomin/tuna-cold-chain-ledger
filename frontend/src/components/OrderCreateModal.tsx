import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Send, Package, Truck, FileText, AlertTriangle } from 'lucide-react';
import { fetchFleets } from '../services/fleet.service';
import type { Fleet } from '../services/fleet.service';
import { type LocalizedProduct, type LocalizedSupplier } from '../utils/i18nHelper';

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
    const { t, i18n } = useTranslation();
    const isEn = !i18n.language?.startsWith('ko');
    // 데모 편의를 위한 기본값 설정
    const [skuId, setSkuId] = useState<string>('TUNA-BLUEFIN');
    const [quantity, setQuantity] = useState<number | string>(150);
    const [selectedFleetCode, setSelectedFleetCode] = useState<string>('PF12');
    const [notes, setNotes] = useState<string>('어획 직후 초저온(-55°C) 급속 동결 및 온체인 무결성 검증건');

    const [fleets, setFleets] = useState<Fleet[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    useEffect(() => {
        if (isOpen) {
            fetchFleets().then((data) => {
                if (data && data.length > 0) {
                    setFleets(data);
                    if (!selectedFleetCode) {
                        setSelectedFleetCode(data[0].code);
                    }
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedFleet = fleets.find((f) => f.code === selectedFleetCode) || {
        code: 'PF12',
        name: 'Pacific Ocean Fleet No. 12',
        koName: '태평양 원양선단 2팀',
        homePort: '인천항 제3부두',
    };

    // Fleet별 자동 연동 Logistics 공급사 (PC7: 통영 원양 수산, PF12: 부산 어항 물류)
    const linkedSupplier = selectedFleet.code === 'PC7'
        ? {
            name: 'Tongyeong Deep-Sea Fishery',
            nameKo: '통영 원양 수산',
          }
        : {
            name: 'Busan Harbor Logistics',
            nameKo: '부산 어항 물류',
          };

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
                        supplierName: linkedSupplier.name,
                        supplierNameKo: linkedSupplier.nameKo,
                        supplierNameEn: linkedSupplier.name,
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


    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto">
            <div
                className="w-full max-w-xl rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.95),0_0_40px_rgba(28,51,69,0.5)] overflow-hidden bg-[#182836] border-2 border-[#2b4458] text-slate-100 my-auto relative z-10"
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-5 border-b border-[#24394a] bg-[#121f2b]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center font-bold">
                            <Package className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide font-digital">{t('orderModal.title')}</h3>
                            <p className="text-xs text-slate-400">{t('orderModal.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="w-9 h-9 rounded-2xl bg-[#223647] hover:bg-[#2c455a] text-slate-300 hover:text-white flex items-center justify-center disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#182836]">
                    {error && (
                        <div className="p-4 text-xs rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 font-digital">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* SKU Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 font-digital">
                                <Package className="w-4 h-4 text-sky-400" />
                                {t('orderModal.species')}
                            </label>
                            <select
                                value={skuId}
                                onChange={(e) => setSkuId(e.target.value)}
                                disabled={submitting}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-medium border bg-[#101a24] border-[#263c4e] text-slate-100 focus:outline-none focus:border-sky-400"
                            >
                                <option value="TUNA-BLUEFIN">
                                    {isEn ? 'Pacific Bluefin Tuna Loin (Frozen)' : '참다랑어 로인 (냉동)'}
                                </option>
                                <option value="TUNA-BIGEYE">
                                    {isEn ? 'Bigeye Tuna Loin (Frozen)' : '눈다랑어 로인 (냉동)'}
                                </option>
                                <option value="TUNA-YELLOWFIN">
                                    {isEn ? 'Yellowfin Tuna Loin (Frozen)' : '황다랑어 로인 (냉동)'}
                                </option>
                            </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 font-digital">
                                <Truck className="w-4 h-4 text-sky-400" />
                                {t('orderModal.quantityKg')}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    setQuantity('');
                                  } else {
                                    setQuantity(Number(val));
                                  }
                                }}
                                disabled={submitting}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-medium border bg-[#101a24] border-[#263c4e] text-slate-100 focus:outline-none focus:border-sky-400 font-mono placeholder:text-slate-500"
                                placeholder={t('orderModal.quantityPlaceholder')}
                                required
                            />
                        </div>

                        {/* Catching Fleet */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 font-digital">
                                <Truck className="w-4 h-4 text-sky-400" />
                                {t('orderModal.fishingFleet')}
                            </label>
                            <select
                                value={selectedFleetCode}
                                onChange={(e) => setSelectedFleetCode(e.target.value)}
                                disabled={submitting}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-medium border bg-[#101a24] border-[#263c4e] text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer"
                            >
                                {fleets.length > 0 ? (
                                    fleets.map((fleet) => (
                                        <option key={fleet.id || fleet.code} value={fleet.code}>
                                            {isEn ? `${fleet.name} (${fleet.koName})` : `${fleet.koName} (${fleet.name})`}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="PF12">{isEn ? 'Pacific Ocean Fleet No. 12 (태평양 원양선단 2팀)' : '태평양 원양선단 2팀 (Pacific Ocean Fleet No. 12)'}</option>
                                        <option value="PC7">{isEn ? 'Pacific Ocean Fleet No. 7 (남태평양 원양선단 1팀)' : '남태평양 원양선단 1팀 (Pacific Ocean Fleet No. 7)'}</option>
                                    </>
                                )}
                            </select>

                            {/* Selected Fleet Info Display Card & Automated Supplier Linkage */}
                            {selectedFleet && (
                                <div className="mt-2.5 p-3.5 rounded-2xl bg-[#121f2b] border border-[#223647] flex flex-col gap-2.5 text-xs shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-300 p-[2px] shadow-sm shrink-0">
                                                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-black text-xs text-cyan-300 font-mono">
                                                    {selectedFleet.code.slice(0, 2).toUpperCase()}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-white text-xs sm:text-sm">{isEn ? selectedFleet.name : selectedFleet.koName}</h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 font-digital">
                                                    <span>{isEn ? selectedFleet.koName : selectedFleet.name}</span>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-cyan-300 font-semibold">{t('dashboard.metrics.homePort')}: {selectedFleet.homePort}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto-linked Supplier / Logistics info banner */}
                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                                        <span className="text-slate-400">담당 물류/공급사 (Logistics):</span>
                                        <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {isEn ? linkedSupplier.name : `${linkedSupplier.nameKo} (${linkedSupplier.name})`}
                                        </span>
                                    </div>
                                </div>
                            )}

                        </div>



                        {/* Notes */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 font-digital">
                                <FileText className="w-4 h-4 text-sky-400" />
                                {t('orderModal.notes')}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={submitting}
                                rows={3}
                                className="w-full px-4 py-3 rounded-2xl text-xs font-medium border bg-[#101a24] border-[#263c4e] text-slate-100 focus:outline-none focus:border-sky-400 resize-none placeholder:text-slate-500"
                                placeholder={t('orderModal.notesPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Submitting Banner */}
                    {submitting && (
                        <div className="p-4 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center gap-3 font-digital">
                            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-cyan-400" />
                            <div className="text-xs font-medium leading-relaxed">
                                <p className="font-bold">{t('orderModal.submittingOnChain')}</p>
                                <p className="text-[11px] text-sky-300/80">{t('orderModal.submittingHash')}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#24394a] font-digital">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-3 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#223647] disabled:opacity-50"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !isDev}
                            title={!isDev ? t('orderList.demoRestricted') : ''}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all select-none ${
                                !isDev
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700/60 opacity-60 cursor-not-allowed'
                                    : 'bg-sky-400 text-slate-950 hover:bg-sky-300 disabled:opacity-50'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t('common.loading')}</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 stroke-[2.5]" />
                                    <span>{t('orderModal.submit')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

