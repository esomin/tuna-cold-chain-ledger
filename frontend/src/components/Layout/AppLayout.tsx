import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    LogOut,
    Waves,
    ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CONTRACT_ADDRESS, ETHERSCAN_BASE_URL } from '../../config';

const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        {
            path: '/',
            icon: <LayoutDashboard className="w-5 h-5" />,
            label: '대시보드',
            tooltip: '통합 관제 대시보드'
        },
        {
            path: '/blockchain-ledger',
            icon: <Database className="w-5 h-5" />,
            label: '원장 탐색기',
            tooltip: '온체인 감사 원장 탐색기'
        },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="relative min-h-screen w-full flex justify-center items-start p-3 sm:p-6 lg:p-8 overflow-x-hidden">
            {/* Ambient Background Lighting Overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 240, 255, 0.08) 0%, rgba(3, 15, 30, 0.45) 55%, rgba(1, 7, 16, 0.85) 100%)'
                }}
            />

            {/* Floating Workspace Layout: Left Pill Dock + Main Glass Window */}
            <div className="relative z-10 w-full max-w-[1520px] flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6">

                {/* Floating Left Pill Navigation Bar (Matching Reference Mockup) */}
                <aside className="shrink-0 flex lg:flex-col items-center justify-between lg:justify-start gap-3.5 glass-dock rounded-2xl lg:rounded-[32px] p-3 lg:p-3.5 lg:py-5 lg:h-fit lg:self-start lg:sticky lg:top-8 z-30">

                    {/* Top App Glow Emblem */}
                    <Link
                        to="/"
                        title="Tuna Cold Chain Ledger"
                        className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 ocean-glow-active"
                    >
                        <Waves className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2.5]" />
                    </Link>

                    {/* Divider in Desktop */}
                    <div className="hidden lg:block w-7 h-[1px] bg-white/10 my-0.5" />

                    {/* Nav Items */}
                    <nav className="flex lg:flex-col items-center gap-3">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path.startsWith('/verify') && location.pathname.startsWith('/verify'));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={item.tooltip}
                                    className={`relative group w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive
                                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/10 hover:border hover:border-white/15'
                                        }`}
                                >
                                    {item.icon}

                                    {/* Tooltip on Desktop */}
                                    <span className="hidden lg:group-hover:block absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-xl bg-slate-950/95 text-sky-200 border border-sky-500/30 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
                                        {item.tooltip}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider before Profile on Desktop */}
                    <div className="hidden lg:block w-7 h-[1px] bg-white/10 my-0.5" />

                    {/* Profile & User Actions (Placed directly with Nav in compact dock) */}
                    <div className="flex lg:flex-col items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                title={user?.name || '사용자 프로필'}
                                className={`w-11 h-11 rounded-2xl border transition-all shadow-inner flex items-center justify-center text-sm font-bold ${userMenuOpen
                                    ? 'bg-sky-500/20 border-sky-400/60 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                                    : 'bg-white/5 border-white/15 hover:border-sky-400/40 hover:bg-white/10 text-sky-300'
                                    }`}
                            >
                                {user?.name ? user.name[0].toUpperCase() : 'TC'}
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 lg:left-full lg:right-auto lg:top-0 lg:ml-3 mt-2 lg:mt-0 w-56 rounded-2xl glass-dock shadow-[0_10px_30px_rgba(0,0,0,0.6)] py-2 z-50 border border-sky-500/25 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-4 py-2 border-b border-white/10">
                                        <p className="text-xs font-bold text-slate-100">{user?.name || '남태평양 원양선단'}</p>
                                        <p className="text-[10px] text-sky-300 font-mono mt-0.5">{user?.role || 'COLD_CHAIN_ADMIN'}</p>
                                    </div>
                                    <a
                                        href={`${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-300 hover:text-sky-300 hover:bg-white/5 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Database className="w-3.5 h-3.5 text-sky-400" />
                                            Sepolia Explorer
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-slate-500" />
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>로그아웃</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Floating Large Glass Window Container */}
                <main className="flex-1 flex flex-col min-w-0 glass-container rounded-[28px] lg:rounded-[36px] overflow-hidden shadow-2xl min-h-[calc(100vh-4rem)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;


