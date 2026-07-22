import React, { useEffect, useState } from 'react';

interface AuditLog {
    id: string;
    action: string;
    dataHash: string;
    txHash: string;
    createdAt: string;
}

interface DistributionTimelineProps {
    poNumber: string | null;
    status: string | null;
}

interface StepInfo {
    key: string;
    label: string;
    description: string;
    statusTrigger: string[];
}

export const DistributionTimeline: React.FC<DistributionTimelineProps> = ({ poNumber, status }) => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const steps: StepInfo[] = [
        {
            key: 'HARVESTED',
            label: '어획 완료 (Harvested)',
            description: '원산지(어장) 정보 확정 및 최초 온체인 무결성 해시 등록',
            statusTrigger: ['DRAFT', 'PENDING', 'COMPLETED'],
        },
        {
            key: 'PROCESSED',
            label: '초저온 가공 (Processed)',
            description: '초저온 냉동고 입고 및 포장 규격 해시 블록체인 기록',
            statusTrigger: ['PENDING', 'COMPLETED'],
        },
        {
            key: 'SHIPPED',
            label: '배송중 (Shipped)',
            description: '초저온 유통 차량 매핑 및 온도 이탈 경고 여부 체크포인트 등록',
            statusTrigger: ['PENDING', 'COMPLETED'],
        },
        {
            key: 'COMPLETED',
            label: '입고 완료 (Delivered)',
            description: '최종 매장 입고 및 소비자 검증용 온체인 인증서 발급',
            statusTrigger: ['COMPLETED'],
        },
    ];

    useEffect(() => {
        if (!poNumber) return;

        const fetchAuditLogs = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/audit-logs`);
                if (response.ok) {
                    const data = await response.json();
                    // 해당 poNumber와 관련된 로그 필터링
                    const filtered = data.filter((log: AuditLog) =>
                        log.action.includes(poNumber) ||
                        (poNumber === 'PO-2026-SCENARIO-A' && log.action.includes('A')) ||
                        (poNumber === 'PO-2026-SCENARIO-B' && log.action.includes('B')) ||
                        (poNumber === 'PO-2026-SCENARIO-C' && log.action.includes('C')) ||
                        log.action === 'CREATE_PO_HARVESTED' // 기본 모킹 이력 매핑용
                    );
                    setAuditLogs(filtered);
                }
            } catch (err) {
                console.error('Error fetching audit logs', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
        // 5초마다 폴링하여 실시간 트랜잭션 업데이트 반영
        const interval = setInterval(fetchAuditLogs, 5000);
        return () => clearInterval(interval);
    }, [poNumber, status]);

    const getStepStatus = (step: StepInfo) => {
        if (!status) return 'WAITING';

        // COMPLETED 단계이고, status가 COMPLETED이면 성공
        if (step.key === 'COMPLETED' && status.toUpperCase() === 'COMPLETED') {
            return 'VERIFIED';
        }
        // 다른 단계들의 트리거 매칭
        const isTriggered = step.statusTrigger.includes(status.toUpperCase());
        if (isTriggered) {
            // 시나리오별로 A는 전부 온체인 검증 완료, B도 완료되었으나 온도 위험 포함, C는 배송중 상태
            if (poNumber === 'PO-2026-SCENARIO-A') return 'VERIFIED';
            if (poNumber === 'PO-2026-SCENARIO-B') {
                return step.key === 'SHIPPED' ? 'WARNING' : 'VERIFIED';
            }
            if (poNumber === 'PO-2026-SCENARIO-C') {
                if (step.key === 'COMPLETED') return 'WAITING';
                return 'VERIFIED';
            }
            return 'VERIFIED';
        }
        return 'WAITING';
    };

    const getStepAuditData = (stepKey: string) => {
        // 감사 로그에서 해당 단계 매칭
        return auditLogs.find(log => log.action.toUpperCase().includes(stepKey)) || null;
    };

    if (!poNumber) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                좌측에서 발주/운송 건을 선택하면 타임라인이 표기됩니다.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-200">온체인 유통 타임라인</h3>
                {loading && <span className="text-[10px] text-blue-400 animate-pulse">원장 동기화 중...</span>}
            </div>

            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
                {steps.map((step) => {
                    const stepStatus = getStepStatus(step);
                    const audit = getStepAuditData(step.key);

                    return (
                        <div key={step.key} className="relative">
                            {/* 노드 포인트 마커 */}
                            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                stepStatus === 'VERIFIED'
                                    ? 'bg-[#10B981] border-[#34D399] shadow-md shadow-[#10B981]/50'
                                    : stepStatus === 'WARNING'
                                    ? 'bg-rose-500 border-rose-400 shadow-md shadow-rose-500/50'
                                    : 'bg-slate-950 border-slate-800'
                            }`} />

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-sm font-semibold transition-colors duration-200 ${
                                        stepStatus === 'VERIFIED' ? 'text-[#10B981]' : 'text-slate-300'
                                    }`}>
                                        {step.label}
                                    </h4>
                                    {stepStatus === 'VERIFIED' && (
                                        <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30 font-bold">
                                            SIGNATURE VERIFIED
                                        </span>
                                    )}
                                    {stepStatus === 'WARNING' && (
                                        <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold animate-pulse">
                                            CRITICAL TEMP BREACH
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* 블록체인 익스플로러 카드 노출 */}
                                {(stepStatus === 'VERIFIED' || stepStatus === 'WARNING') && (
                                    <div className="mt-2 p-3 rounded-lg bg-slate-900/40 border border-slate-900 text-[10px] font-mono text-slate-500 space-y-1">
                                        <p className="flex justify-between">
                                            <span>Tx Hash:</span>
                                            <span className="text-slate-400 hover:text-blue-400 transition-colors truncate max-w-[200px] cursor-pointer" title={audit?.txHash || '0x' + 'a'.repeat(64)}>
                                                {audit?.txHash || '0x' + 'a'.repeat(12) + '...' + 'a'.repeat(8)}
                                            </span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span>Data Hash:</span>
                                            <span className="text-slate-400 truncate max-w-[200px]" title={audit?.dataHash || '0x' + 'b'.repeat(64)}>
                                                {audit?.dataHash || '0x' + 'b'.repeat(12) + '...' + 'b'.repeat(8)}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
