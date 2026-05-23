import React, { Suspense } from 'react';
import { Layout, Menu, Button, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DashboardOutlined,
  ContactsOutlined,
  SolutionOutlined,
  FileTextOutlined,
  DropboxOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut, type User } from 'firebase/auth';

const { Header, Content, Sider } = Layout;

const pathToKey: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/orders': 'orders',
  '/customers': 'customers',
  '/products': 'products',
  '/product-categories': 'productCategories',
  '/ingredients': 'ingredients',
  '/ingredient-categories': 'ingredientCategories',
  '/supply': 'supply',
  '/suppliers': 'suppliers',
  '/contacts': 'contacts',
  '/billing': 'billing',
};

const menuItems: MenuProps['items'] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
  { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Đơn hàng' },
  { key: 'customers', icon: <UserOutlined />, label: 'Quản lý khách hàng' },
  { key: 'products', icon: <AppstoreOutlined />, label: 'Sản phẩm' },
  { key: 'productCategories', icon: <AppstoreOutlined />, label: 'Loại sản phẩm' },
  { key: 'ingredients', icon: <DropboxOutlined />, label: 'Nguyên liệu' },
  { key: 'ingredientCategories', icon: <DropboxOutlined />, label: 'Loại nguyên liệu' },
  { key: 'supply', icon: <SolutionOutlined />, label: 'Cung ứng' },
  { key: 'suppliers', icon: <ContactsOutlined />, label: 'Nhà cung cấp' },
  { key: 'contacts', icon: <ContactsOutlined />, label: 'Liên hệ' },
  { key: 'billing', icon: <FileTextOutlined />, label: 'Hóa đơn / In hóa đơn' },
];

const keyToPath: Record<string, string> = {
  dashboard: '/dashboard',
  orders: '/orders',
  customers: '/customers',
  products: '/products',
  productCategories: '/product-categories',
  ingredients: '/ingredients',
  ingredientCategories: '/ingredient-categories',
  supply: '/supply',
  suppliers: '/suppliers',
  contacts: '/contacts',
  billing: '/billing',
};

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

type AppLayoutProps = {
  admin: User;
  onLogout: () => void;
};

const AppLayout: React.FC<AppLayoutProps> = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = pathToKey[location.pathname] ?? 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          Quản Lý Tiệm Bánh
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(keyToPath[key] ?? '/dashboard')}
          items={menuItems}
        />
        <div style={{ color: '#fff', margin: 16 }}>
          <span>Admin: {admin.email}</span>
          <Button
            type="link"
            danger
            onClick={() => {
              signOut(auth);
              onLogout();
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{ background: '#fff', padding: 0, textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}
        >
          Hệ thống quản lý tiệm bánh Vân Ngọc
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
