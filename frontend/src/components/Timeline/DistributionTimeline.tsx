import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ETHERSCAN_BASE_URL } from '../../config';

interface StageLog {
    stageKey: string;
    stageName: string;
    dataHash: string;
    txHash: string;
    isRecorded?: boolean;
    timestamp?: string | null;
}

interface DistributionTimelineProps {
    poNumber: string | null;
    status: string | null;
    isLoading?: boolean;
    isBackendError?: boolean;
}

interface StepInfo {
    key: string;
    label: string;
    codeLabel: string;
    description: string;
    statusTrigger: string[];
}

export const DistributionTimeline: React.FC<DistributionTimelineProps> = ({ poNumber, status, isLoading, isBackendError }) => {
    const { t } = useTranslation();
    const [stageLogs, setStageLogs] = useState<StageLog[]>([]);

    const steps: StepInfo[] = [
        {
            key: 'HARVESTED',
            label: t('timeline.harvestedLabel'),
            codeLabel: 'HARVESTED',
            description: t('timeline.harvestedDesc'),
            statusTrigger: ['HARVESTED', 'DRAFT', 'PENDING', 'COMPLETED'],
        },
        {
            key: 'PROCESSING',
            label: t('timeline.processingLabel'),
            codeLabel: 'PROCESSED',
            description: t('timeline.processingDesc'),
            statusTrigger: ['PROCESSING', 'PENDING', 'COMPLETED'],
        },
        {
            key: 'IN_TRANSIT',
            label: t('timeline.inTransitLabel'),
            codeLabel: 'IN-TRANSIT',
            description: t('timeline.inTransitDesc'),
            statusTrigger: ['IN_TRANSIT', 'PENDING', 'COMPLETED'],
        },
        {
            key: 'DELIVERED',
            label: t('timeline.deliveredLabel'),
            codeLabel: 'DELIVERED',
            description: t('timeline.deliveredDesc'),
            statusTrigger: ['DELIVERED', 'COMPLETED'],
        },
    ];

    useEffect(() => {
        if (!poNumber || isBackendError) return;

        const fetchVerification = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/purchase-orders/${poNumber}/verify`);
                if (response.ok) {
                    const data = await response.json();
                    if (data?.blockchain?.stageLogs) {
                        setStageLogs(data.blockchain.stageLogs);
                    }
                }
            } catch (err) {
                console.error('Error fetching verification stage logs', err);
            }
        };

        fetchVerification();
        const interval = setInterval(fetchVerification, 5000);
        return () => clearInterval(interval);
    }, [poNumber, status, isBackendError]);

    const getStepStatus = (step: StepInfo): 'VERIFIED' | 'WARNING' | 'WAITING' => {
        if (!status) return 'WAITING';

        if (step.key === 'DELIVERED' && (status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'DELIVERED')) {
            return 'VERIFIED';
        }

        const currentPoStatus = status.toUpperCase();
        if (
            poNumber === 'PO-2026-SCENARIO-A' ||
            poNumber === 'PO-2026-SCENARIO-B' ||
            currentPoStatus === 'COMPLETED' ||
            currentPoStatus === 'DELIVERED'
        ) {
            return 'VERIFIED';
        }

        const isTriggered = step.statusTrigger.includes(currentPoStatus);
        if (isTriggered) {
            return 'VERIFIED';
        }
        return 'WAITING';
    };

    const getStepStageLog = (stepKey: string) => {
        return stageLogs.find(log => log.stageKey === stepKey) || null;
    };

    if (isLoading) {
        return (
            <div className="relative border-l border-white/10 ml-3 pl-5 space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative space-y-1.5 animate-pulse">
                        <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-slate-700" />
                        <div className="flex items-center justify-between">
                            <div className="h-3.5 w-24 bg-slate-800 rounded" />
                            <div className="h-3 w-14 bg-slate-800/60 rounded-full" />
                        </div>
                        <div className="h-3 w-4/5 bg-slate-800/50 rounded" />
                    </div>
                ))}
            </div>
        );
    }



    if (isBackendError) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-digital text-center p-4">
                서버 연결 후 이용할 수 있습니다.
            </div>
        );
    }

    if (!poNumber) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-digital">
                좌측에서 발주/운송 건을 선택하면 타임라인이 표기됩니다.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative border-l border-sky-500/20 ml-3 pl-5 space-y-5">
                {steps.map((step) => {
                    const stepStatus = getStepStatus(step);
                    const stageLog = getStepStageLog(step.key);
                    const txHash = stageLog?.txHash && stageLog.txHash !== 'ON-CHAIN PENDING' ? stageLog.txHash : null;

                    return (
                        <div key={step.key} className="relative">
                            {/* Node Point Marker */}
                            <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${stepStatus === 'VERIFIED'
                                ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_#10b981]'
                                : stepStatus === 'WARNING'
                                    ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_#f43f5e]'
                                    : 'bg-slate-900 border-slate-700'
                                }`} />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-xs font-bold font-digital transition-colors duration-200 ${stepStatus === 'VERIFIED' ? 'text-emerald-300' : 'text-slate-200'
                                            }`}>
                                            {step.label}
                                        </h4>
                                        <span className="text-[10px] font-digital text-sky-400/70">
                                            ({step.codeLabel})
                                        </span>
                                    </div>
                                    {stepStatus === 'VERIFIED' && (
                                        <span className="text-[9px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold font-digital">
                                            ✓ VERIFIED
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Blockchain Explorer Micro Card */}
                                {stepStatus === 'VERIFIED' && txHash && (
                                    <div className="mt-1.5 p-2 rounded-xl glass-card-inner text-[10px] font-mono text-slate-400 space-y-0.5 border border-white/5">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-slate-400">Tx:</span>
                                            <a
                                                href={`${ETHERSCAN_BASE_URL}/tx/${txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-300 hover:text-cyan-200 font-bold hover:underline truncate max-w-[170px] flex items-center gap-1"
                                                title={txHash}
                                            >
                                                <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                            </a>
                                        </div>
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

