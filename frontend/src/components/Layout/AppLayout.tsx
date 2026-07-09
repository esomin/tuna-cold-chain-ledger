import React from 'react';
import { Layout, Menu, Typography, theme, Avatar, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BarChartOutlined,
    DatabaseOutlined,
    ShoppingCartOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const userMenuItems = [
        {
            key: 'profile',
            label: (
                <div style={{ padding: '4px 8px' }}>
                    <Text strong style={{ display: 'block' }}>{user?.name || '사용자'}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{user?.role || 'USER'}</Text>
                </div>
            ),
            disabled: true,
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: '로그아웃',
            danger: true,
            onClick: () => {
                logout();
                navigate('/login');
            },
        },
    ];

    const menuItems = [
        {
            key: '/',
            icon: <BarChartOutlined />,
            label: '대시보드',
        },
        {
            key: '/skus',
            icon: <DatabaseOutlined />,
            label: '재고(SKU) 관리',
        },
        {
            key: '/purchase-orders',
            icon: <ShoppingCartOutlined />,
            label: '발주안 관리',
        }
    ];

    const handleMenuClick = (info: { key: string }) => {
        navigate(info.key);
    };



    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={260} style={{ background: '#001529' }}>
                <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        background: '#1677ff',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px'
                    }}>
                        IF
                    </div>
                    <Title level={5} style={{ color: 'white', margin: 0, fontWeight: 600 }}>
                        Inventory<br />Forecaster
                    </Title>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Header style={{
                    padding: '0 24px',
                    background: colorBgContainer,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    zIndex: 1
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', gap: '8px' }}>
                        {user && (
                            <Text style={{ marginRight: 4 }}>{user.name}</Text>
                        )}
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                            <Avatar
                                style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
                                icon={<UserOutlined />}
                            />
                        </Dropdown>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
