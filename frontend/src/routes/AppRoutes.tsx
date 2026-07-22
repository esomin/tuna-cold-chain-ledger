import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import ConsumerVerify from '../pages/ConsumerVerify';
import BlockchainLedger from '../pages/BlockchainLedger';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Mobile Verification Routes */}
            <Route path="/verify" element={<ConsumerVerify />} />
            <Route path="/verify/:id" element={<ConsumerVerify />} />

            {/* Direct Routes */}
            <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="blockchain-ledger" element={<BlockchainLedger />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;

