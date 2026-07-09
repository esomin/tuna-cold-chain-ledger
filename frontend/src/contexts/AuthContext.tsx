import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';

export interface User {
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user] = useState<User | null>({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
    });
    const [isLoading] = useState<boolean>(false);

    const login = async (email: string, pass: string) => {
        // No-op
    };

    const logout = () => {
        // No-op
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: true, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
