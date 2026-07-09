import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import SKUList from '../pages/SKUList';
import PurchaseOrders from '../pages/PurchaseOrders';

const DashboardRedirect = () => {
    return <Navigate to="/skus" replace />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Direct Routes */}
            <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardRedirect />} />
                <Route path="skus" element={<SKUList />} />
                <Route path="purchase-orders" element={<PurchaseOrders />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
