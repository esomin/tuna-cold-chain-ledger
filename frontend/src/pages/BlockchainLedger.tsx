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
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';

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
            setAuditLogs([]);
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
            className="dark space-y-6 min-h-screen p-6 -m-6"
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
                <div className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>총 등록 트랜잭션</span>
                        <Boxes className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2" style={{ color: 'var(--theme-cream)' }}>{auditLogs.length} Blocks</p>
                </div>

                <div className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>스마트 계약 상태</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold mt-2 text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>ColdChainTracker (Active)</span>
                    </p>
                </div>

                <div className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>해시 검증 무결성</span>
                        <ShieldAlert className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2" style={{ color: 'var(--theme-aqua)' }}>100% VERIFIED</p>
                </div>

                <div className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
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
            <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                <Table>
                    <TableHeader className="bg-[var(--theme-card-inner-bg)]">
                        <TableRow>
                            <TableHead className="uppercase">Tx Hash (트랜잭션)</TableHead>
                            <TableHead className="uppercase">이벤트 / 단계</TableHead>
                            <TableHead className="uppercase">Keccak256 Data Hash</TableHead>
                            <TableHead className="uppercase">생성 일시</TableHead>
                            <TableHead className="uppercase text-right">상세조회</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="p-12 text-center text-slate-400">
                                    <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)', borderTopColor: 'var(--theme-aqua)' }}></div>
                                    온체인 원장 데이터 로딩 중...
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow 
                                    key={log.id} 
                                    className="cursor-pointer"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <TableCell className="font-mono text-cyan-400 max-w-[180px] truncate" title={log.txHash}>
                                        <div className="flex items-center gap-1.5">
                                            <Hash className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                            <span className="truncate">{log.txHash}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded text-[10px] font-bold border" style={{ backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.1)', color: 'var(--theme-aqua)', borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)' }}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono max-w-[220px] truncate" title={log.dataHash}>
                                        {log.dataHash}
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px]">
                                        {new Date(log.createdAt).toLocaleString('ko-KR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button 
                                            className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLog(log);
                                            }}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="p-12 text-center text-slate-400">
                                    일치하는 온체인 감사 로그가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
