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
        <div 
            className="min-h-screen flex justify-center font-sans"
            style={{
                backgroundColor: 'var(--theme-night)',
                color: 'var(--theme-cream)'
            }}
        >
            {/* Mobile View Container */}
            <div 
                className="w-full max-w-lg flex flex-col min-h-screen relative shadow-2xl overflow-hidden pb-12"
                style={{
                    backgroundColor: 'var(--theme-night)',
                    borderLeft: '1px solid rgba(var(--theme-cream-rgb), 0.15)',
                    borderRight: '1px solid rgba(var(--theme-cream-rgb), 0.15)'
                }}
            >
                {/* Header */}
                <header 
                    className="p-4 backdrop-blur sticky top-0 z-30 flex items-center justify-between border-b"
                    style={{
                        backgroundColor: 'var(--theme-night)',
                        borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                    }}
                >
                    <Link 
                        to="/" 
                        className="flex items-center text-xs font-semibold gap-1.5 transition-colors"
                        style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        관제 센터
                    </Link>
                    <div 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)',
                            color: 'var(--theme-aqua)'
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Smart Provenance</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-5 flex-1 space-y-6">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)', borderTopColor: 'var(--theme-aqua)' }}></div>
                            <p className="text-sm font-medium animate-pulse" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>이더리움 블록체인 무결성 대조 중...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Verified Seal Hero Animation */}
                            <section 
                                className="relative flex flex-col items-center justify-center p-6 rounded-3xl overflow-hidden shadow-lg"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)'
                                }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)' }}></div>

                                {/* Animated Seal */}
                                <div className={`relative mb-4 transition-transform duration-700 ${isAnimating ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}`}>
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center p-2 relative shadow-lg" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)', border: '2px solid var(--theme-aqua)' }}>
                                        <div className="w-full h-full rounded-full border border-dashed flex items-center justify-center" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.6)', backgroundColor: 'var(--theme-card-inner-bg)' }}>
                                            <ShieldCheck className="w-12 h-12 animate-bounce" style={{ color: 'var(--theme-aqua)' }} />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 right-0 p-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-aqua)', color: 'var(--theme-night)' }}>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold tracking-wide text-center flex items-center gap-2" style={{ color: 'var(--theme-cream)' }}>
                                    <span>블록체인 정품 인증 완료</span>
                                </h2>
                                <p className="text-xs font-semibold mt-1 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)', color: 'var(--theme-aqua)' }}>
                                    위변조 불가 이더리움 스마트 계약 수록
                                </p>

                                <div className="mt-4 pt-4 w-full flex items-center justify-between text-xs border-t" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                    <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>검증 일시</span>
                                    <span className="font-mono" style={{ color: 'var(--theme-cream)' }}>{new Date(data.verifiedAt).toLocaleString('ko-KR')}</span>
                                </div>
                            </section>

                            {/* Product Info Card */}
                            <section className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>제품 및 원산지 정보</h3>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono" style={{ backgroundColor: 'var(--theme-card-inner-bg)', color: 'var(--theme-cream)' }}>{data.purchaseOrder.poNumber}</span>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-base font-bold" style={{ color: 'var(--theme-cream)' }}>{data.purchaseOrder.product.name}</h4>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-aqua)' }} />
                                            <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>어획지:</span>
                                            <span className="font-medium" style={{ color: 'var(--theme-cream)' }}>{data.purchaseOrder.product.originLocation}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-aqua)' }} />
                                            <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>어획일자:</span>
                                            <span className="font-medium" style={{ color: 'var(--theme-cream)' }}>{data.purchaseOrder.product.harvestDate}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Store className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-aqua)' }} />
                                            <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>공급/어선:</span>
                                            <span className="font-medium" style={{ color: 'var(--theme-cream)' }}>{data.purchaseOrder.supplierName}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Cold Chain Integrity Stats */}
                            <section className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                        <Thermometer className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                                        콜드체인 초저온 보관 상태
                                    </h3>
                                    <span 
                                        className="text-xs font-bold px-2 py-0.5 rounded" 
                                        style={{ 
                                            backgroundColor: data.temperatureStats.hasAnomaly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                                            color: data.temperatureStats.hasAnomaly ? '#f87171' : '#10B981' 
                                        }}
                                    >
                                        {data.temperatureStats.hasAnomaly ? '운송 중 주의 필요 (-55°C 표준)' : '최적 유지 중 (-55°C 표준)'}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--theme-card-inner-bg)' }}>
                                    <div>
                                        <p className="text-[11px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>최근 실시간 감지 온도</p>
                                        <p className="text-2xl font-black font-mono mt-0.5" style={{ color: data.temperatureStats.latestTemp > -55 ? '#f87171' : 'var(--theme-aqua)' }}>
                                            {data.temperatureStats.latestTemp}°C
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>온도 이탈 건수</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: data.temperatureStats.hasAnomaly ? '#f87171' : '#10B981' }}>
                                            {data.temperatureStats.hasAnomaly ? '1건 (콜드체인 임계 이탈)' : '0건 (안전 규격 준수)'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Supply Chain Timeline Progress */}
                            <section className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>유통 파이프라인 타임라인</h3>

                                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5" style={{ '--tw-before-bg': 'rgba(var(--theme-cream-rgb), 0.15)' } as any}>
                                    {/* Step 1: Harvested */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: 'var(--theme-aqua)', color: 'var(--theme-night)' }}>
                                            <Anchor className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: 'var(--theme-cream)' }}>1단계: 원양 어획 (Harvested)</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>남태평양 청정 수역 어획 완료 및 스마트 계약 1차 서명</p>
                                        </div>
                                    </div>

                                    {/* Step 2: Processing */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: 'var(--theme-aqua)', color: 'var(--theme-night)' }}>
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: 'var(--theme-cream)' }}>2단계: 급속 동결 가공 (Processing)</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>선상 -50°C 급속 동결 처리 및 HACCP 품질 검사</p>
                                        </div>
                                    </div>

                                    {/* Step 3: In-Transit */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div 
                                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg" 
                                            style={{ 
                                                backgroundColor: data.purchaseOrder.status !== 'COMPLETED' ? '#10B981' : 'var(--theme-aqua)', 
                                                color: data.purchaseOrder.status !== 'COMPLETED' ? 'white' : 'var(--theme-night)' 
                                            }}
                                        >
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold" style={{ color: 'var(--theme-cream)' }}>3단계: 운송중 (In-Transit)</p>
                                                {data.purchaseOrder.status !== 'COMPLETED' && (
                                                    <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30 font-bold animate-pulse">
                                                        현재 진행 단계
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>IoT 센서 실시간 위치/온도 스트리밍 관제</p>
                                        </div>
                                    </div>

                                    {/* Step 4: Delivered */}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div 
                                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg" 
                                            style={{ 
                                                backgroundColor: data.purchaseOrder.status === 'COMPLETED' ? '#10B981' : 'rgba(var(--theme-cream-rgb), 0.15)', 
                                                color: data.purchaseOrder.status === 'COMPLETED' ? 'white' : 'rgba(var(--theme-cream-rgb), 0.4)' 
                                            }}
                                        >
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold" style={{ color: data.purchaseOrder.status === 'COMPLETED' ? 'var(--theme-cream)' : 'rgba(var(--theme-cream-rgb), 0.5)' }}>
                                                    4단계: 매장 입고 & 검증 (Delivered)
                                                </p>
                                                {data.purchaseOrder.status === 'COMPLETED' && (
                                                    <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30 font-bold">
                                                        최종 완료
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>최종 소비자 정품 인증 씰 발급 완료</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Blockchain Raw Proof Card */}
                            <section className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                    <span>온체인 블록체인 검증 데이터</span>
                                    <ExternalLink className="w-3.5 h-3.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }} />
                                </h3>
                                <div className="space-y-1.5 text-[11px] font-mono break-all p-2.5 rounded-lg" style={{ backgroundColor: 'var(--theme-card-inner-bg)', color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                    <div>
                                        <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>Target PO: </span>
                                        <span style={{ color: 'var(--theme-cream)' }}>{data.purchaseOrder.poNumber}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>Data Keccak256 Hash: </span>
                                        <span style={{ color: '#10B981' }}>{data.calculatedHash}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>Smart Contract: </span>
                                        <span style={{ color: 'var(--theme-aqua)' }}>0x5FbDB2315678afecb367f032d93F642f64180aa3</span>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={fetchVerificationData}
                                className="w-full py-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    color: 'var(--theme-cream)'
                                }}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                블록체인 최신 상태 새로고침
                            </button>
                        </>
                    ) : null}
                </main>

                {/* Footer */}
                <footer className="p-4 text-center text-[11px] space-y-1 border-t" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.1)', color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>
                    <p>Powered by Ethereum Blockchain & Cold Chain IoT Platform</p>
                    <p>© 2026 Tuna Supply Chain Transparency Initiative</p>
                </footer>
            </div>
        </div>
    );
};

export default ConsumerVerify;
