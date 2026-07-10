import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
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
            label: '대시보드',
        }
    ];


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-muted/20">
            {/* Sidebar */}
            <aside className="w-64 bg-[#121c2e] text-slate-100 flex flex-col shrink-0 border-r border-[#1a283f]">
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3 border-b border-[#1a283f]">
                    <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                        TC
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-white leading-none">
                            <span className="text-[#46a5b8]">Tuna</span><span className="text-white">Chain</span>
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
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                    isActive
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-sm font-semibold'
                                        : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-[#1a283f]/60'
                                }`}
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
                <header className="h-16 bg-[#121c2e] border-b border-[#1a283f] px-6 flex items-center justify-end relative z-10 shadow-lg">
                    <div className="flex items-center gap-4">
                        {user && (
                            <span className="text-sm text-slate-200 font-medium hidden sm:inline">
                                {user.name}
                            </span>
                        )}

                        {/* User Menu Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#1a283f] transition-all focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-cyan-600 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm select-none">
                                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-[#1a283f] border border-[#25395c] rounded-xl shadow-xl py-1.5 z-20">
                                    <div className="px-4 py-2 border-b border-[#25395c]">
                                        <p className="text-sm font-semibold text-slate-100 leading-none">{user?.name || '사용자'}</p>
                                        <p className="text-xs text-slate-400 mt-1.5">{user?.role || 'USER'}</p>
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
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;

