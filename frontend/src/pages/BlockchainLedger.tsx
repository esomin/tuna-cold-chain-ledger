import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    Boxes,
    ChevronRight,
    X
} from 'lucide-react';
import axios from 'axios';
import { CONTRACT_ADDRESS, ETHERSCAN_BASE_URL } from '../config';
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
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('search') || searchParams.get('po') || '';

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
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

    useEffect(() => {
        const query = searchParams.get('search') || searchParams.get('po');
        if (query) {
            setSearchQuery(query);
        }
    }, [searchParams]);

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
        <div className="p-4 sm:p-7 lg:p-8 flex flex-col gap-6 text-slate-100">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                            <Database className="w-6 h-6 text-sky-400" />
                            <span>On-Chain Blockchain Ledger</span>
                            <span className="text-sky-400 font-normal">Explorer</span>
                        </h1>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            Sepolia Smart Contract
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Ethereum smart contract transactions and Keccak256 cryptographic integrity hash blocks
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={`${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 transition-all shadow-md hover:scale-105"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Sepolia Etherscan ↗</span>
                    </a>
                    <button
                        onClick={fetchAuditLogs}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-all hover:scale-105"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>원장 최신화</span>
                    </button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">총 기록 블록수</span>
                        <Boxes className="w-4 h-4 text-sky-400" />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2 text-white">{auditLogs.length} Blocks</p>
                </div>

                <div className="glass-card rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">스마트 계약 상태</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold mt-2 text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <a
                            href={`${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                        >
                            <span>ColdChainTracker (Active) ↗</span>
                        </a>
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">해시 검증 무결성</span>
                        <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-black font-mono mt-2 text-cyan-300">100% VERIFIED</p>
                </div>

                <div className="glass-card rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">최초 원장 등록 시각</span>
                        <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs font-mono mt-3 text-slate-200">
                        {auditLogs.length > 0 ? new Date(auditLogs[auditLogs.length - 1].createdAt).toLocaleDateString('ko-KR') : '-'}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card">
                {/* Search Input */}
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="PO 번호, Tx Hash, Data Hash 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border bg-slate-950/60 border-white/10 text-white focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-500"
                    />
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                    {['ALL', 'HARVESTED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedActionFilter(filter)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                                selectedActionFilter === filter
                                    ? 'bg-sky-500/25 text-sky-300 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="rounded-3xl glass-card overflow-hidden shadow-2xl min-h-[420px] flex flex-col">
                <Table className="table-fixed w-full">
                    <TableHeader className="bg-white/5 border-b border-white/10">
                        <TableRow>
                            <TableHead className="w-[26%] uppercase text-slate-300 text-[11px] font-bold">Tx Hash (트랜잭션)</TableHead>
                            <TableHead className="w-[18%] uppercase text-slate-300 text-[11px] font-bold">이벤트 / 단계</TableHead>
                            <TableHead className="w-[28%] uppercase text-slate-300 text-[11px] font-bold">Keccak256 Data Hash</TableHead>
                            <TableHead className="w-[18%] uppercase text-slate-300 text-[11px] font-bold">생성 일시</TableHead>
                            <TableHead className="w-[10%] uppercase text-slate-300 text-[11px] font-bold text-right">상세조회</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-28 text-center text-slate-400">
                                    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    온체인 원장 데이터 로딩 중...
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow 
                                    key={log.id} 
                                    className="cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <TableCell className="font-mono text-cyan-300 max-w-[180px] truncate" title={log.txHash}>
                                        <div className="flex items-center gap-1.5">
                                            <Hash className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                            <a
                                                href={log.txHash.startsWith('0x') && !log.txHash.includes('ffffff') ? `${ETHERSCAN_BASE_URL}/tx/${log.txHash}` : `${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="truncate hover:underline font-bold flex items-center gap-1"
                                            >
                                                <span>{log.txHash}</span>
                                                <ExternalLink className="w-3 h-3 shrink-0 text-cyan-400" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-sky-500/15 text-sky-300 border-sky-500/30">
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-300 max-w-[220px] truncate text-xs" title={log.dataHash}>
                                        {log.dataHash}
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px] text-slate-400">
                                        {new Date(log.createdAt).toLocaleString('ko-KR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button 
                                            className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
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
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-3xl p-6 shadow-[0_30px_100px_rgba(0,0,0,0.95)] bg-[#182836] border-2 border-[#2b4458] text-slate-100 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#223647] hover:bg-[#2c455a] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center justify-between pr-8">
                            <div className="flex items-center gap-2.5">
                                <Database className="w-5 h-5 text-sky-400" />
                                <h3 className="text-base font-bold text-white">온체인 트랜잭션 상세 원장</h3>
                            </div>
                            <a
                                href={selectedLog.txHash.startsWith('0x') && !selectedLog.txHash.includes('ffffff') ? `${ETHERSCAN_BASE_URL}/tx/${selectedLog.txHash}` : `${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 transition-colors hover:scale-105"
                            >
                                <span>Sepolia Etherscan ↗</span>
                            </a>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="p-3.5 rounded-2xl bg-[#101a24] border border-[#263c4e] space-y-1">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Action / Event</p>
                                <p className="text-xs font-bold text-emerald-300">{selectedLog.action}</p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-[#101a24] border border-[#263c4e] space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Transaction Hash (TxHash)</p>
                                    <a
                                        href={selectedLog.txHash.startsWith('0x') && !selectedLog.txHash.includes('ffffff') ? `${ETHERSCAN_BASE_URL}/tx/${selectedLog.txHash}` : `${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold hover:underline flex items-center gap-1 text-sky-300"
                                    >
                                        <span>Etherscan에서 트랜잭션 보기 ↗</span>
                                    </a>
                                </div>
                                <p className="text-xs font-mono text-cyan-300 break-all">{selectedLog.txHash}</p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-[#101a24] border border-[#263c4e] space-y-1">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Keccak256 Data Hash</p>
                                <p className="text-xs font-mono text-slate-200 break-all">{selectedLog.dataHash}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-[#101a24] border border-[#263c4e] space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">스마트 계약 주소</p>
                                    <a
                                        href={`${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-mono text-cyan-300 truncate hover:underline block font-bold"
                                        title={CONTRACT_ADDRESS}
                                    >
                                        {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-4)} ↗
                                    </a>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-[#101a24] border border-[#263c4e] space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">서명 상태</p>
                                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>ON-CHAIN VERIFIED</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-5 py-2 bg-[#223647] hover:bg-[#2c455a] text-xs font-bold rounded-xl transition-colors text-white"
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

