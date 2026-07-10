import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

export interface User {
    id: number;
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
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
    });
    const [isLoading] = useState<boolean>(false);

    const login = async (email: string, pass: string) => {
        // Log parameters to avoid unused warning in a clean way
        console.debug('Logging in mock user', email, pass.substring(0, 1) + '***');
    };

    const logout = () => {
        console.debug('Logging out mock user');
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

