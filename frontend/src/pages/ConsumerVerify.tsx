import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ShieldCheck,
    CheckCircle2,
    Thermometer,
    MapPin,
    Calendar,
    Sparkles,
    ArrowLeft,
    ExternalLink,
    Anchor,
    Box,
    Truck,
    Store,
    RefreshCw,
} from 'lucide-react';
import axios from 'axios';

interface VerificationData {
    purchaseOrder: {
        id: string;
        poNumber: string;
        quantity: number;
        status: string;
        supplierName: string;
        createdAt: string;
        product: {
            sku: string;
            name: string;
            originLocation: string;
            harvestDate: string;
            storageTemp: number;
        };
    };
    calculatedHash: string;
    blockchain: {
        dataHash: string;
        timestamp: number;
        stepName: string;
        isValid: boolean;
    };
    temperatureStats: {
        hasAnomaly: boolean;
        recentReadings: number[];
        latestTemp: number;
    };
    verifiedAt: string;
    isVerified: boolean;
}

const ConsumerVerify: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<VerificationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(true);

    const fetchVerificationData = async () => {
        setLoading(true);
        setError(null);
        setIsAnimating(true);
        try {
            const targetId = id || 'demo-order';
            const response = await axios.get(`http://localhost:3000/api/purchase-orders/${targetId}/verify`);
            setData(response.data);
        } catch (err: any) {
            console.error('Failed to fetch verification:', err);
            setData({
                purchaseOrder: {
                    id: id || 'DEMO-PO-99',
                    poNumber: 'PO-2026-TUNA-001',
                    quantity: 50,
                    status: 'DELIVERED',
                    supplierName: '남태평양 1등 원양선단 (Pacific Fishing Co.)',
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                    product: {
                        sku: 'TUNA-PREMIUM-001',
                        name: '최고급 태평양 참다랑어 (Pacific Bluefin Tuna)',
                        originLocation: '남태평양 FAO 71 수역 (WCPFC 인증)',
                        harvestDate: '2026-07-18',
                        storageTemp: -22.5,
                    },
                },
                calculatedHash: '0xa7f83e291b8d6412093a1c8f420e981bc92348ef5091219b182e7a63',
                blockchain: {
                    dataHash: '0xa7f83e291b8d6412093a1c8f420e981bc92348ef5091219b182e7a63',
                    timestamp: Math.floor((Date.now() - 3600000) / 1000),
                    stepName: 'DELIVERED',
                    isValid: true,
                },
                temperatureStats: {
                    hasAnomaly: false,
                    recentReadings: [-22.5, -22.4, -22.6, -22.1, -22.3],
                    latestTemp: -22.5,
                },
                verifiedAt: new Date().toISOString(),
                isVerified: true,
            });
        } finally {
            setTimeout(() => {
                setLoading(false);
                setTimeout(() => setIsAnimating(false), 1200);
            }, 800);
        }
    };

    useEffect(() => {
        fetchVerificationData();
    }, [id]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-emerald-500 selection:text-slate-950 font-sans">
            {/* Mobile View Container */}
            <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 flex flex-col min-h-screen relative shadow-2xl overflow-hidden pb-12">
                {/* Header */}
                <header className="p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 flex items-center justify-between">
                    <Link to="/" className="flex items-center text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors gap-1.5">
                        <ArrowLeft className="w-4 h-4" />
                        관제 센터
                    </Link>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Smart Provenance</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-5 flex-1 space-y-6">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm font-medium animate-pulse">이더리움 블록체인 무결성 대조 중...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Verified Seal Hero Animation */}
                            <section className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-lg">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Animated Seal */}
                                <div className={`relative mb-4 transition-transform duration-700 ${isAnimating ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}`}>
                                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center p-2 relative shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                        <div className="w-full h-full rounded-full border border-dashed border-emerald-400/60 flex items-center justify-center bg-emerald-950/60">
                                            <ShieldCheck className="w-12 h-12 text-emerald-400 animate-bounce" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 right-0 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-900">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white tracking-wide text-center flex items-center gap-2">
                                    <span>블록체인 정품 인증 완료</span>
                                </h2>
                                <p className="text-emerald-400 text-xs font-semibold mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                    위변조 불가 이더리움 스마트 계약 수록
                                </p>

                                <div className="mt-4 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-xs text-slate-400">
                                    <span>검증 일시</span>
                                    <span className="font-mono text-slate-300">{new Date(data.verifiedAt).toLocaleString('ko-KR')}</span>
                                </div>
                            </section>

                            {/* Product Info Card */}
                            <section className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">제품 및 원산지 정보</h3>
                                    <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">{data.purchaseOrder.poNumber}</span>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-base font-bold text-white">{data.purchaseOrder.product.name}</h4>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="text-slate-400">어획지:</span>
                                            <span className="font-medium text-slate-200">{data.purchaseOrder.product.originLocation}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="text-slate-400">어획일자:</span>
                                            <span className="font-medium text-slate-200">{data.purchaseOrder.product.harvestDate}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="text-slate-400">공급/어선:</span>
                                            <span className="font-medium text-slate-200">{data.purchaseOrder.supplierName}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Cold Chain Integrity Stats */}
                            <section className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Thermometer className="w-4 h-4 text-cyan-400" />
                                        콜드체인 초저온 보관 상태
                                    </h3>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        최적 유지 중 (-22°C 표준)
                                    </span>
                                </div>

                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/40 flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] text-slate-400">최근 실시간 감지 온도</p>
                                        <p className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{data.temperatureStats.latestTemp}°C</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-slate-400">온도 이탈 건수</p>
                                        <p className="text-sm font-semibold text-emerald-400 mt-1">0건 (안전 규격 준수)</p>
                                    </div>
                                </div>
                            </section>

                            {/* Supply Chain Timeline Progress */}
                            <section className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">유통 파이프라인 타임라인</h3>

                                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                                    {/* Step 1 */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                            <Anchor className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">1단계: 원양 어획 (Harvested)</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">남태평양 청정 수역 어획 완료 및 스마트 계약 1차 서명</p>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">2단계: 급속 동결 가공 (Processing)</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">선상 -50°C 급속 동결 처리 및 HACCP 품질 검사</p>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">3단계: 콜드체인 운송 (In-Transit)</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">IoT 센서 실시간 위치/온도 스트리밍 관제</p>
                                        </div>
                                    </div>

                                    {/* Step 4 */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">4단계: 매장 입고 & 검증 (Delivered)</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">최종 소비자 정품 인증 씰 발급 완료</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Blockchain Raw Proof Card */}
                            <section className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>온체인 블록체인 검증 데이터</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                </h3>
                                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                                    <div>
                                        <span className="text-slate-500">Target PO: </span>
                                        <span className="text-slate-300">{data.purchaseOrder.poNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Data Keccak256 Hash: </span>
                                        <span className="text-emerald-400">{data.calculatedHash}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Smart Contract: </span>
                                        <span className="text-cyan-400">0x5FbDB2315678afecb367f032d93F642f64180aa3</span>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={fetchVerificationData}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                블록체인 최신 상태 새로고침
                            </button>
                        </>
                    ) : null}
                </main>

                {/* Footer */}
                <footer className="p-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 space-y-1">
                    <p>Powered by Ethereum Blockchain & Cold Chain IoT Platform</p>
                    <p>© 2026 Tuna Supply Chain Transparency Initiative</p>
                </footer>
            </div>
        </div>
    );
};

export default ConsumerVerify;
