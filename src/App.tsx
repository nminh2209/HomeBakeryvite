

import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
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
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Orders from './pages/Orders';
import Supply from './pages/Supply';
import Suppliers from './pages/Suppliers';
import Contacts from './pages/Contacts';
import Ingredients from './pages/Ingredients';
import Products from './pages/Products';
import Billing from './pages/Billing';
import 'antd/dist/reset.css';

const { Header, Content, Sider } = Layout;

const pageMap: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  orders: <Orders />,
  supply: <Supply />,
  suppliers: <Suppliers />,
  contacts: <Contacts />,
  ingredients: <Ingredients />,
  products: <Products />,
  billing: <Billing />,
};

const menuItems: MenuProps['items'] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Bảng điều khiển',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: 'Đơn hàng',
  },
  {
    key: 'supply',
    icon: <SolutionOutlined />,
    label: 'Cung ứng',
  },
  {
    key: 'suppliers',
    icon: <ContactsOutlined />,
    label: 'Nhà cung cấp',
  },
  {
    key: 'contacts',
    icon: <UserOutlined />,
    label: 'Liên hệ',
  },
  {
    key: 'ingredients',
    icon: <DropboxOutlined />,
    label: 'Nguyên liệu',
  },
  {
    key: 'products',
    icon: <AppstoreOutlined />,
    label: 'Sản phẩm',
  },
  {
    key: 'billing',
    icon: <FileTextOutlined />,
    label: 'Hóa đơn / In hóa đơn',
  },
];


const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdmin(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Đang kiểm tra phiên đăng nhập...</div>;
  if (!admin) return <AdminLogin onLogin={() => setAdmin(auth.currentUser)} />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          Quản trị Tiệm Bánh
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key as string)}
          items={menuItems}
        />
        <div style={{ color: '#fff', margin: 16 }}>
          <span>Admin: {admin.email}</span>
          <Button type="link" danger onClick={() => { signOut(auth); setAdmin(null); }}>
            Đăng xuất
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0, textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>
          Hệ thống quản lý tiệm bánh Việt Nam
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            {pageMap[selectedKey]}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
