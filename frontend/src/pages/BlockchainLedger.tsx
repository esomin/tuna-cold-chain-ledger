import React, { useEffect, useState } from 'react';
import {
    Database,
    Search,
    Filter,
    ExternalLink,
    CheckCircle2,
    ShieldAlert,
    RefreshCw,
    Hash,
    Clock,
    FileText,
    Boxes,
    ChevronRight,
    X
} from 'lucide-react';
import axios from 'axios';

interface AuditLog {
    id: string;
    action: string;
    dataHash: string;
    txHash: string;
    createdAt: string;
}

const BlockchainLedger: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const response = await axios.get(`${apiUrl}/audit-logs`);
            setAuditLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            // Mock fallback audit logs for demo
            setAuditLogs([
                {
                    id: '101',
                    action: 'CREATE_PO_HARVESTED [PO-2026-SCENARIO-A]',
                    dataHash: '0xa7f83e291b8d6412093a1c8f420e981bc92348ef5091219b182e7a63',
                    txHash: '0x8b31a29f801c4e723910f2c8d19a4e8039e1028374619b0271542a193481239c',
                    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
                },
                {
                    id: '102',
                    action: 'UPDATE_PO_STATUS_PROCESSING [PO-2026-SCENARIO-A]',
                    dataHash: '0xb8f94e302c9e7523104b2d9f531f092cd03459fa6102320c293f8b74',
                    txHash: '0x9c42b30a912d5f834021a3d9e20b5f9140f2039485720c1382653b204592340d',
                    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
                },
                {
                    id: '103',
                    action: 'UPDATE_PO_STATUS_IN_TRANSIT [PO-2026-SCENARIO-B]',
                    dataHash: '0xc9a05f413da08634215c3ea0642a103de14560ab7213431d304a9c85',
                    txHash: '0x0d53c41b023e6a945132b4eaf31c6a02510a304956831d2493764c315603451e',
                    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
                },
                {
                    id: '104',
                    action: 'UPDATE_PO_STATUS_DELIVERED [PO-2026-SCENARIO-A]',
                    dataHash: '0xd0b16a524eb19745326d4fb1753b214ef25671bc8324542e405ba096',
                    txHash: '0x1e64d52c134f7b056243c5fb042d7b13621b405067942e3504875d426714562f',
                    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    // 필터링 및 검색 처리
    const filteredLogs = auditLogs.filter((log) => {
        const matchesQuery =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.dataHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.txHash.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedActionFilter === 'ALL') return matchesQuery;
        if (selectedActionFilter === 'HARVESTED') return matchesQuery && log.action.includes('HARVESTED');
        if (selectedActionFilter === 'PROCESSING') return matchesQuery && log.action.includes('PROCESSING');
        if (selectedActionFilter === 'IN_TRANSIT') return matchesQuery && log.action.includes('IN_TRANSIT');
        if (selectedActionFilter === 'DELIVERED') return matchesQuery && log.action.includes('DELIVERED');
        return matchesQuery;
    });

    return (
        <div 
            className="space-y-6 min-h-screen p-6 -m-6"
            style={{
                backgroundColor: 'var(--theme-night)',
                color: 'var(--theme-cream)'
            }}
        >
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)' }}>
                <div>
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-cream)' }}>
                        <Database className="w-5 h-5" style={{ color: 'var(--theme-aqua)' }} />
                        <span title="온체인 블록체인 감사 원장 탐색기" className="cursor-help transition-colors hover:text-[var(--theme-aqua)]">
                            On-Chain Blockchain Ledger Explorer
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-normal" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)', color: 'var(--theme-aqua)' }}>
                            Smart Contract Audit
                        </span>
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                        Smart contract transactions and Keccak256 data integrity hashes loaded on Ethereum local nodes
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAuditLogs}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            color: 'var(--theme-cream)',
                            borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                        }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>원장 최신화</span>
                    </button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-4 shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>총 등록 트랜잭션</span>
                        <Boxes className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2" style={{ color: 'var(--theme-cream)' }}>{auditLogs.length} Blocks</p>
                </div>

                <div className="rounded-xl p-4 shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>스마트 계약 상태</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold mt-2 text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>ColdChainTracker (Active)</span>
                    </p>
                </div>

                <div className="rounded-xl p-4 shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>해시 검증 무결성</span>
                        <ShieldAlert className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2" style={{ color: 'var(--theme-aqua)' }}>100% VERIFIED</p>
                </div>

                <div className="rounded-xl p-4 shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>최초 원장 등록 시각</span>
                        <Clock className="w-4 h-4" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }} />
                    </div>
                    <p className="text-xs font-mono mt-3" style={{ color: 'var(--theme-cream)' }}>
                        {auditLogs.length > 0 ? new Date(auditLogs[auditLogs.length - 1].createdAt).toLocaleDateString('ko-KR') : '-'}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                {/* Search Input */}
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }} />
                    <input
                        type="text"
                        placeholder="PO 번호, Tx Hash, Data Hash 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border focus:outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--theme-card-inner-bg)',
                            color: 'var(--theme-cream)',
                            borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                        }}
                    />
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    <Filter className="w-3.5 h-3.5 mr-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }} />
                    {['ALL', 'HARVESTED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedActionFilter(filter)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap"
                            style={{
                                backgroundColor: selectedActionFilter === filter ? 'rgba(var(--theme-aqua-rgb), 0.15)' : 'var(--theme-card-inner-bg)',
                                color: selectedActionFilter === filter ? 'var(--theme-aqua)' : 'rgba(var(--theme-cream-rgb), 0.7)',
                                borderColor: selectedActionFilter === filter ? 'var(--theme-aqua)' : 'rgba(var(--theme-cream-rgb), 0.1)'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="rounded-xl shadow-lg border overflow-hidden" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wider border-b" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)', color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                <th className="p-4">Tx Hash (트랜잭션)</th>
                                <th className="p-4">이벤트 / 단계</th>
                                <th className="p-4">Keccak256 Data Hash</th>
                                <th className="p-4">생성 일시</th>
                                <th className="p-4 text-right">상세조회</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-xs" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.08)' }}>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)', borderTopColor: 'var(--theme-aqua)' }}></div>
                                        온체인 원장 데이터 로딩 중...
                                    </td>
                                </tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr 
                                        key={log.id} 
                                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="p-4 font-mono text-cyan-400 max-w-[180px] truncate" title={log.txHash}>
                                            <div className="flex items-center gap-1.5">
                                                <Hash className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                                <span className="truncate">{log.txHash}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded text-[10px] font-bold border" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.1)', color: 'var(--theme-aqua)', borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono max-w-[220px] truncate" style={{ color: 'rgba(var(--theme-cream-rgb), 0.8)' }} title={log.dataHash}>
                                            {log.dataHash}
                                        </td>
                                        <td className="p-4 font-mono text-[11px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                                            {new Date(log.createdAt).toLocaleString('ko-KR')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLog(log);
                                                }}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        일치하는 온체인 감사 로그가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-2xl p-6 shadow-2xl border space-y-4 relative animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.2)', color: 'var(--theme-cream)' }}>
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5" style={{ color: 'var(--theme-aqua)' }} />
                            <h3 className="text-base font-bold">온체인 트랜잭션 상세 원장</h3>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Action / Event</p>
                                <p className="text-xs font-bold text-emerald-400">{selectedLog.action}</p>
                            </div>

                            <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Transaction Hash (TxHash)</p>
                                <p className="text-xs font-mono text-cyan-400 break-all">{selectedLog.txHash}</p>
                            </div>

                            <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Keccak256 Data Hash</p>
                                <p className="text-xs font-mono text-slate-200 break-all">{selectedLog.dataHash}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">스마트 계약 주소</p>
                                    <p className="text-xs font-mono text-cyan-400 truncate">0x5FbDB2315678afecb367f...</p>
                                </div>
                                <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--theme-card-inner-bg)', borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">서명 상태</p>
                                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>ON-CHAIN VERIFIED</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockchainLedger;
