import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Database,
    LogOut,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
            label: 'Dashboard',
            tooltip: '대시보드'
        },
        {
            path: '/blockchain-ledger',
            icon: <Database className="w-5 h-5" />,
            label: 'Ledger Explorer',
            tooltip: '온체인 감사 원장 탐색기'
        }
    ];


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: 'var(--theme-night)' }}>
            {/* Sidebar */}
            <aside 
                className="w-64 flex flex-col shrink-0 border-r"
                style={{
                    backgroundColor: 'var(--theme-night)',
                    color: 'var(--theme-cream)',
                    borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                }}
            >
                {/* Logo Section */}
                <div 
                    className="p-6 flex items-center gap-3 border-b"
                    style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.15)' }}
                >
                    <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base shadow-sm"
                        style={{
                            backgroundColor: 'var(--theme-aqua)',
                            color: 'var(--theme-night)'
                        }}
                    >
                        TC
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: 'var(--theme-cream)' }}>
                            <span style={{ color: 'var(--theme-aqua)' }}>Tuna</span><span>Chain</span>
                        </h1>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={item.tooltip}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer hover:text-[var(--theme-aqua)]"
                                style={{
                                    backgroundColor: isActive ? 'rgba(var(--theme-aqua-rgb), 0.15)' : 'transparent',
                                    color: isActive ? 'var(--theme-aqua)' : 'rgba(var(--theme-cream-rgb), 0.7)',
                                    borderColor: isActive ? 'rgba(var(--theme-aqua-rgb), 0.3)' : 'transparent'
                                }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header 
                    className="h-16 border-b px-6 flex items-center justify-end relative z-10 shadow-lg"
                    style={{
                        backgroundColor: 'var(--theme-night)',
                        borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                    }}
                >
                    <div className="flex items-center gap-4">
                        {user && (
                            <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--theme-cream)' }}>
                                {user.name}
                            </span>
                        )}

                        {/* User Menu Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-full transition-all focus:outline-none"
                                style={{ backgroundColor: 'rgba(var(--theme-cream-rgb), 0.05)' }}
                            >
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm select-none"
                                    style={{
                                        backgroundColor: 'var(--theme-aqua)',
                                        color: 'var(--theme-night)'
                                    }}
                                >
                                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                                </div>
                                <ChevronDown className="w-4 h-4" style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }} />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div 
                                    className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-1.5 z-20 border"
                                    style={{
                                        backgroundColor: 'var(--theme-night)',
                                        borderColor: 'rgba(var(--theme-cream-rgb), 0.15)'
                                    }}
                                >
                                    <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.15)' }}>
                                        <p className="text-sm font-semibold leading-none" style={{ color: 'var(--theme-cream)' }}>{user?.name || '사용자'}</p>
                                        <p className="text-xs mt-1.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>{user?.role || 'USER'}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all text-left font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>로그아웃</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Subpage Content */}
                <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--theme-night)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;

