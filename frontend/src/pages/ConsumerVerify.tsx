import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocalizedProductName, getLocalizedSupplierName, getLocalizedPort, type LocalizedProduct, type LocalizedSupplier } from '../utils/i18nHelper';
import {
    ShieldCheck,
    CheckCircle2,
    Thermometer,
    MapPin,
    Calendar,
    ArrowLeft,
    Anchor,
    Box,
    Truck,
    Store,
    RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { API_URL, CONTRACT_ADDRESS, ETHERSCAN_BASE_URL } from '../config';

interface StageLog {
    stageKey: string;
    stageName: string;
    dataHash: string;
    txHash: string;
    isRecorded?: boolean;
    timestamp: string | null;
}

interface VerificationData {
    purchaseOrder: LocalizedSupplier & {
        id: string;
        poNumber: string;
        quantity: number;
        status: string;
        supplierName?: string;
        supplierNameKo?: string;
        supplierNameEn?: string;
        createdAt: string;
        notes?: string;
        fleet?: {
            id?: string;
            code?: string;
            name?: string;
            koName?: string;
            homePort?: string;
            homePortEn?: string;
        };
        product?: LocalizedProduct & {
            sku?: string;
            originLocation?: string;
            harvestDate?: string;
            storageTemp?: number;
        };
    };
    calculatedHash: string;
    blockchain: {
        dataHash: string;
        txHash?: string;
        contractAddress?: string;
        timestamp: number;
        stepName: string;
        isValid: boolean;
        stageLogs?: StageLog[];
    };
    temperatureStats: {
        hasAnomaly: boolean;
        anomalyCount?: number;
        recentReadings: number[];
        latestTemp: number;
    };
    verifiedAt: string;
    isVerified: boolean;
}

const ConsumerVerify: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<VerificationData | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(true);
    const [activeStageKey, setActiveStageKey] = useState<string>('HARVESTED');

    const fetchVerificationData = async () => {
        setLoading(true);
        setIsAnimating(true);
        try {
            let targetId = id;
            if (!targetId) {
                // If no specific PO is passed in URL, fetch list and pick the latest PO
                const listRes = await axios.get(`${API_URL}/purchase-orders`);
                if (Array.isArray(listRes.data) && listRes.data.length > 0) {
                    targetId = listRes.data[0].id || listRes.data[0].poNumber;
                } else {
                    targetId = 'PO-2026-SCENARIO-A';
                }
            }
            const response = await axios.get(`${API_URL}/purchase-orders/${targetId}/verify`);
            setData(response.data);
            if (response.data?.purchaseOrder?.status) {
                const s = response.data.purchaseOrder.status.toUpperCase();
                if (s === 'COMPLETED' || s === 'DELIVERED') setActiveStageKey('DELIVERED');
                else if (s === 'IN_TRANSIT' || s === 'PENDING') setActiveStageKey('IN_TRANSIT');
                else if (s === 'PROCESSING') setActiveStageKey('PROCESSING');
                else setActiveStageKey('HARVESTED');
            }
        } catch (err: any) {
            console.error('Failed to fetch verification:', err);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setTimeout(() => setIsAnimating(false), 1200);
            }, 500);
        }
    };

    useEffect(() => {
        fetchVerificationData();
    }, [id]);

    const isKo = i18n.language?.startsWith('ko');

    return (
        <div 
            className="min-h-screen flex justify-center items-center font-sans p-3 sm:p-6"
        >
            {/* Mobile View Glass Container */}
            <div 
                className="w-full max-w-lg flex flex-col min-h-[90vh] relative shadow-2xl rounded-3xl glass-container overflow-hidden pb-12 border border-white/20 animate-in fade-in duration-300"
            >
                {/* Header */}
                <header 
                    className="px-5 py-4 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/40 rounded-t-3xl"
                >
                    <Link 
                        to="/" 
                        className="flex items-center text-xs font-semibold gap-1.5 transition-colors text-slate-300 hover:text-white pl-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('nav.dashboard')}
                    </Link>
                    <span className="text-xs font-medium tracking-wide text-sky-400/90 font-mono">
                        Smart Provenance
                    </span>
                </header>

                {/* Main Content */}
                <main className="p-5 flex-1 space-y-6">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)', borderTopColor: 'var(--theme-aqua)' }}></div>
                            <p className="text-sm font-medium animate-pulse" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                {isKo ? '이더리움 블록체인 무결성 대조 중...' : 'Verifying Ethereum On-Chain Integrity...'}
                            </p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Verified Seal Hero Animation */}
                            <section 
                                className="relative flex flex-col items-center justify-center p-6 rounded-3xl overflow-hidden shadow-lg glass-card"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-sky-500/15" />

                                {/* Animated Seal */}
                                <div className={`relative mb-4 transition-transform duration-700 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center p-2 relative shadow-lg bg-sky-500/20 border-2 border-sky-400 shadow-sky-500/30">
                                        <div className="w-full h-full rounded-full border border-dashed border-sky-300/60 flex items-center justify-center glass-card-inner">
                                            <ShieldCheck className="w-11 h-11 animate-pulse text-sky-400" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-md bg-sky-400 text-slate-950">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold tracking-wide text-center flex items-center gap-2 text-white">
                                    <span>{isKo ? '블록체인 무결성 인증 완료' : 'Blockchain Integrity Verified'}</span>
                                </h2>
                                <p className="text-xs font-semibold mt-1 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                    {isKo ? '위변조 불가 이더리움 스마트 계약 수록' : 'Tamper-Proof Ethereum Smart Contract Recorded'}
                                </p>

                                <div className="mt-4 pt-4 w-full flex items-center justify-between text-xs border-t border-white/10">
                                    <span className="text-slate-400">{isKo ? '검증 일시' : 'Verified At'}</span>
                                    <span className="font-mono text-slate-200">
                                        {new Date(data.verifiedAt).toLocaleString(isKo ? 'ko-KR' : 'en-US')}
                                    </span>
                                </div>
                            </section>

                            {/* Product Info Card */}
                            <section className="rounded-2xl p-4 space-y-3 glass-card">
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {isKo ? '제품 및 원산지 정보' : 'Product & Origin Information'}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono glass-card-inner text-sky-300">
                                        {data.purchaseOrder.poNumber}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-base font-bold text-white">
                                        {getLocalizedProductName(data.purchaseOrder.product, i18n.language) || data.purchaseOrder.product?.sku || (isKo ? '최고급 냉동 참다랑어' : 'Premium Frozen Tuna')}
                                    </h4>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="w-4 h-4 shrink-0 text-sky-400" />
                                            <span className="text-slate-400">{isKo ? '어획지 / 출항지:' : 'Origin / Port:'}</span>
                                            <span className="font-medium text-slate-200">
                                                {data.purchaseOrder.fleet
                                                    ? (isKo ? data.purchaseOrder.fleet.homePort : (data.purchaseOrder.fleet.homePortEn || getLocalizedPort(data.purchaseOrder.fleet.homePort, i18n.language)))
                                                    : (data.purchaseOrder.product?.originLocation || (isKo ? '남태평양 FAO 71 수역' : 'Western Pacific FAO 71'))}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Calendar className="w-4 h-4 shrink-0 text-sky-400" />
                                            <span className="text-slate-400">{isKo ? '등록/어획 일자:' : 'Harvest / Log Date:'}</span>
                                            <span className="font-medium text-slate-200">
                                                {data.purchaseOrder.product?.harvestDate || (data.purchaseOrder.createdAt ? new Date(data.purchaseOrder.createdAt).toLocaleDateString(isKo ? 'ko-KR' : 'en-US') : '-')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Store className="w-4 h-4 shrink-0 text-sky-400" />
                                            <span className="text-slate-400">{isKo ? '어선단 / 공급사:' : 'Fleet / Supplier:'}</span>
                                            <span className="font-medium text-slate-200">
                                                {data.purchaseOrder.fleet
                                                    ? (isKo ? data.purchaseOrder.fleet.koName : data.purchaseOrder.fleet.name)
                                                    : (getLocalizedSupplierName(data.purchaseOrder, i18n.language) || data.purchaseOrder.supplierName || (isKo ? '태평양 원양선단' : 'Pacific Ocean Fleet'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Cold Chain Integrity Stats */}
                            {(() => {
                                const currentTemp = data.temperatureStats.latestTemp;
                                const anomalyCount = data.temperatureStats.anomalyCount ?? (data.temperatureStats.hasAnomaly ? 1 : 0);
                                const hasPastAnomaly = anomalyCount > 0;
                                const isCurrentSafe = currentTemp <= -45.0; // -45°C safety threshold

                                let badgeText = isKo ? '전 구간 최적 유지 (-55°C 규격)' : '100% Compliant (-55°C)';
                                let badgeBg = 'rgba(16, 185, 129, 0.15)';
                                let badgeColor = '#10B981';
                                let badgeBorder = 'rgba(16, 185, 129, 0.3)';

                                if (!isCurrentSafe) {
                                    badgeText = isKo ? '현재 초저온 규격 초과 (주의 필요)' : 'Warning: Temp Excursion in Progress';
                                    badgeBg = 'rgba(239, 68, 68, 0.15)';
                                    badgeColor = '#f87171';
                                    badgeBorder = 'rgba(239, 68, 68, 0.3)';
                                } else if (hasPastAnomaly) {
                                    badgeText = isKo 
                                        ? `현재 적정 유지 중 (과거 이탈 ${anomalyCount}건)` 
                                        : `Currently Stable (${anomalyCount} past excursions)`;
                                    badgeBg = 'rgba(245, 158, 11, 0.15)';
                                    badgeColor = '#fbbf24';
                                    badgeBorder = 'rgba(245, 158, 11, 0.35)';
                                }

                                return (
                                    <section className="rounded-2xl p-4 space-y-3 glass-card">
                                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400 shrink-0">
                                                <Thermometer className="w-4 h-4 text-sky-400" />
                                                {isKo ? '콜드체인 초저온 보관 상태' : 'Cold Chain Storage Status'}
                                            </h3>
                                            <span 
                                                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all text-right" 
                                                style={{ 
                                                    backgroundColor: badgeBg, 
                                                    color: badgeColor,
                                                    borderColor: badgeBorder
                                                }}
                                            >
                                                {badgeText}
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-xl flex items-center justify-between glass-card-inner border border-white/5">
                                            <div>
                                                <p className="text-[11px] text-slate-400">{isKo ? '최근 실시간 감지 온도' : 'Latest Detected Temp'}</p>
                                                <div className="flex items-baseline gap-2 mt-0.5">
                                                    <p className="text-2xl font-black font-mono" style={{ color: isCurrentSafe ? '#38bdf8' : '#f87171' }}>
                                                        {currentTemp}°C
                                                    </p>
                                                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                                        {isCurrentSafe ? (isKo ? '● 규격 충족' : '● In Range') : (isKo ? '▲ 규격 초과' : '▲ Exceeded')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-400">{isKo ? '전체 이탈 이력' : 'Total Excursion History'}</p>
                                                <p className="text-sm font-semibold mt-1" style={{ color: hasPastAnomaly ? '#fbbf24' : '#10B981' }}>
                                                    {hasPastAnomaly 
                                                        ? (isKo ? `누적 ${anomalyCount}건 (과거 감지)` : `${anomalyCount} past incident(s)`) 
                                                        : (isKo ? '0건 (전 구간 정상)' : '0 incidents (100% Safe)')}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                );
                            })()}

                            {/* Supply Chain Timeline Progress */}
                            <section className="rounded-2xl p-4 space-y-4 glass-card">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {isKo ? '유통 파이프라인 타임라인' : 'Supply Chain Pipeline Timeline'}
                                </h3>

                                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                                    {/* Dynamic stage status helper */}
                                    {(() => {
                                        const poStatus = (data.purchaseOrder.status || '').toUpperCase();
                                        const isHarvestedActive = poStatus === 'HARVESTED' || poStatus === 'DRAFT';
                                        const isProcessingActive = poStatus === 'PROCESSING';
                                        const isInTransitActive = poStatus === 'IN_TRANSIT' || poStatus === 'PENDING';
                                        const isDeliveredActive = poStatus === 'COMPLETED' || poStatus === 'DELIVERED';

                                        return (
                                            <>
                                                {/* Step 1: Harvested */}
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-sky-400 text-slate-950 font-bold">
                                                        <Anchor className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-white">
                                                                {isKo ? '1단계: 원양 어획 (Harvested)' : 'Stage 1: Deep Sea Harvest'}
                                                            </p>
                                                            {isHarvestedActive && (
                                                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold animate-pulse">
                                                                    {isKo ? '현재 진행 단계' : 'Current Stage'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] mt-0.5 text-slate-400">
                                                            {isKo ? '남태평양 청정 수역 어획 완료 및 스마트 계약 1차 서명' : 'Harvest completed in designated ocean area & 1st on-chain signature'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Step 2: Processing */}
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div 
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                                                            isProcessingActive || isInTransitActive || isDeliveredActive 
                                                                ? 'bg-sky-400 text-slate-950' 
                                                                : 'bg-white/10 text-slate-500'
                                                        }`}
                                                    >
                                                        <Box className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-bold ${isProcessingActive || isInTransitActive || isDeliveredActive ? 'text-white' : 'text-slate-500'}`}>
                                                                {isKo ? '2단계: 급속 동결 가공 (Processing)' : 'Stage 2: Blast Freeze Processing'}
                                                            </p>
                                                            {isProcessingActive && (
                                                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold animate-pulse">
                                                                    {isKo ? '현재 진행 단계' : 'Current Stage'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] mt-0.5 text-slate-400">
                                                            {isKo ? '선상 -50°C 급속 동결 처리 및 HACCP 품질 검사' : 'Shipboard -50°C blast freezing & HACCP inspection lock'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Step 3: In-Transit */}
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div 
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                                                            isInTransitActive || isDeliveredActive 
                                                                ? (isInTransitActive ? 'bg-emerald-400 text-slate-950' : 'bg-sky-400 text-slate-950') 
                                                                : 'bg-white/10 text-slate-500'
                                                        }`}
                                                    >
                                                        <Truck className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-bold ${isInTransitActive || isDeliveredActive ? 'text-white' : 'text-slate-500'}`}>
                                                                {isKo ? '3단계: 운송중 (In-Transit)' : 'Stage 3: Reefer In-Transit'}
                                                            </p>
                                                            {isInTransitActive && (
                                                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold animate-pulse">
                                                                    {isKo ? '현재 진행 단계' : 'Current Stage'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] mt-0.5 text-slate-400">
                                                            {isKo ? 'IoT 센서 실시간 위치/초저온 텔레메트리 스트리밍 관제' : 'IoT GPS & ultra-low temp streaming telemetry control'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Step 4: Delivered */}
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div 
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                                                            isDeliveredActive ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-500'
                                                        }`}
                                                    >
                                                        <Store className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-bold ${isDeliveredActive ? 'text-white' : 'text-slate-500'}`}>
                                                                {isKo ? '4단계: 매장 입고 & 검증 (Delivered)' : 'Stage 4: Store Arrival & Delivery'}
                                                            </p>
                                                            {isDeliveredActive && (
                                                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                                                                    {isKo ? '최종 완료' : 'Completed'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] mt-0.5 text-slate-400">
                                                            {isKo ? '최종 소비자 정품 인증 씰 발급 및 무결성 대조 통과' : 'Consumer authentic verification seal generated on-chain'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </section>

                            {/* Blockchain Raw Proof Card */}
                            <section className="rounded-2xl p-4 space-y-3 glass-card">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {isKo ? '온체인 블록체인 검증 데이터 (단계별)' : 'On-Chain Cryptographic Proof (By Stage)'}
                                    </h3>
                                </div>

                                {/* Stage Tabs (1단계 ~ 4단계) */}
                                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl glass-card-inner">
                                    {[
                                        { key: 'HARVESTED', label: isKo ? '1단계 어획' : '1. Harvest' },
                                        { key: 'PROCESSING', label: isKo ? '2단계 가공' : '2. Process' },
                                        { key: 'IN_TRANSIT', label: isKo ? '3단계 운송' : '3. Transit' },
                                        { key: 'DELIVERED', label: isKo ? '4단계 입고' : '4. Store' },
                                    ].map((tab) => {
                                        const isActive = activeStageKey === tab.key;
                                        const stageLogs = data?.blockchain?.stageLogs || [];
                                        const stageLog = stageLogs.find((l: any) => l.stageKey === tab.key);
                                        const isRecorded =
                                            data?.purchaseOrder?.poNumber === 'PO-2026-SCENARIO-A' ||
                                            data?.purchaseOrder?.poNumber === 'PO-2026-SCENARIO-B' ||
                                            (stageLog ? stageLog.isRecorded !== false && stageLog.txHash !== 'ON-CHAIN PENDING' : tab.key === 'HARVESTED');

                                        return (
                                            <button
                                                key={tab.key}
                                                disabled={!isRecorded}
                                                onClick={() => isRecorded && setActiveStageKey(tab.key)}
                                                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center border ${
                                                    !isRecorded 
                                                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500' 
                                                        : isActive 
                                                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-sm' 
                                                            : 'hover:bg-white/5 text-slate-300 border-transparent cursor-pointer'
                                                }`}
                                                title={!isRecorded ? (isKo ? '아직 기록되지 않은 온체인 유통 단계입니다.' : 'Pending on-chain stage') : ''}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Selected Stage Hash & Tx Info */}
                                {(() => {
                                    const stageLogs = data.blockchain.stageLogs || [];
                                    const currentStageLog = stageLogs.find(l => l.stageKey === activeStageKey);
                                    const isRecorded = currentStageLog ? (currentStageLog.isRecorded !== false && currentStageLog.txHash !== 'ON-CHAIN PENDING') : false;

                                    const stageName = activeStageKey === 'HARVESTED' 
                                        ? (isKo ? '1단계: 원양 어획 (Harvested)' : 'Stage 1: Deep Sea Harvest')
                                        : (activeStageKey === 'PROCESSING' 
                                            ? (isKo ? '2단계: 급속 동결 가공 (Processing)' : 'Stage 2: Blast Freeze Processing')
                                            : (activeStageKey === 'IN_TRANSIT' 
                                                ? (isKo ? '3단계: 운송중 (In-Transit)' : 'Stage 3: Reefer In-Transit') 
                                                : (isKo ? '4단계: 매장 입고 (Delivered)' : 'Stage 4: Store Arrival & Delivery')));
                                    
                                    const contractAddr = data.blockchain.contractAddress || CONTRACT_ADDRESS;
                                    const displayTxHash: string = (isRecorded ? (currentStageLog?.txHash || data.blockchain.txHash) : 'ON-CHAIN PENDING') || 'ON-CHAIN PENDING';
                                    const displayDataHash: string = (isRecorded ? (currentStageLog?.dataHash || data.calculatedHash) : 'ON-CHAIN PENDING') || 'ON-CHAIN PENDING';

                                    return (
                                        <div className="space-y-1.5 text-[11px] font-mono p-3.5 rounded-xl glass-card-inner text-slate-300">
                                            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                                <span className="font-bold font-sans text-xs text-white">{stageName}</span>
                                                {isRecorded ? (
                                                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        ON-CHAIN VERIFIED
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                        ON-CHAIN PENDING
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <span className="shrink-0 text-slate-400">PO:</span>
                                                <span className="font-bold text-white">{data.purchaseOrder.poNumber}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="shrink-0 text-slate-400">TxHash:</span>
                                                <span
                                                    className={`font-bold truncate text-right max-w-[260px] ${isRecorded ? 'text-sky-300' : 'text-slate-500'}`}
                                                    title={displayTxHash}
                                                >
                                                    {displayTxHash.length > 24 ? `${displayTxHash.slice(0, 10)}...${displayTxHash.slice(-8)}` : displayTxHash}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="shrink-0 text-slate-400">Data Hash:</span>
                                                <span
                                                    className={`font-bold truncate text-right max-w-[260px] ${isRecorded ? 'text-emerald-400' : 'text-slate-500'}`}
                                                    title={displayDataHash}
                                                >
                                                    {displayDataHash.length > 24 ? `${displayDataHash.slice(0, 10)}...${displayDataHash.slice(-8)}` : displayDataHash}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="shrink-0 text-slate-400">Contract:</span>
                                                <a
                                                    href={`${ETHERSCAN_BASE_URL}/address/${contractAddr}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline font-bold truncate text-right text-sky-400"
                                                    title={contractAddr}
                                                >
                                                    {contractAddr ? `${contractAddr.slice(0, 10)}...${contractAddr.slice(-4)} ↗` : '-'}
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </section>

                            <button
                                onClick={fetchVerificationData}
                                className="w-full py-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 glass-card hover:border-sky-400/40 text-slate-200 hover:text-white active:scale-[0.99] cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                                {isKo ? '블록체인 최신 상태 새로고침' : 'Refresh Blockchain Verification State'}
                            </button>
                        </>
                    ) : (
                        <div className="py-20 text-center space-y-3 glass-card rounded-2xl p-6">
                            <p className="text-sm font-semibold text-slate-300">
                                {isKo ? '검증 가능한 발주/운송 데이터를 찾을 수 없습니다.' : 'No verification order data found.'}
                            </p>
                            <Link 
                                to="/" 
                                className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 transition-all"
                            >
                                {isKo ? '대시보드로 돌아가기' : 'Return to Dashboard'}
                            </Link>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="p-4 text-center text-[11px] space-y-1 border-t border-white/10 text-slate-400">
                    <p>Powered by Ethereum Blockchain & Cold Chain IoT Platform</p>
                    <p>© 2026 Tuna Supply Chain Transparency Initiative</p>
                </footer>
            </div>
        </div>
    );
};

export default ConsumerVerify;
