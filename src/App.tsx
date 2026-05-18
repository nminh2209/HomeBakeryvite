

import React, { Suspense, useState } from 'react';
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
import AdminLogin from './pages/AdminLogin';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import 'antd/dist/reset.css';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Products = React.lazy(() => import('./pages/Products'));
const ProductCategories = React.lazy(() => import('./pages/ProductCategories'));
const Ingredients = React.lazy(() => import('./pages/Ingredients'));
const IngredientCategories = React.lazy(() => import('./pages/IngredientCategories'));
const Supply = React.lazy(() => import('./pages/Supply'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const Billing = React.lazy(() => import('./pages/Billing'));

const { Header, Content, Sider } = Layout;

const pageMap: Record<string, React.LazyExoticComponent<React.FC>> = {
  dashboard: Dashboard,
  orders: Orders,
  customers: Customers,
  products: Products,
  productCategories: ProductCategories,
  ingredients: Ingredients,
  ingredientCategories: IngredientCategories,
  supply: Supply,
  suppliers: Suppliers,
  contacts: Contacts,
  billing: Billing,
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
    key: 'customers',
    icon: <UserOutlined />,
    label: 'Quản lý khách hàng',
  },
  {
    key: 'products',
    icon: <AppstoreOutlined />,
    label: 'Sản phẩm',
  },
  {
    key: 'productCategories',
    icon: <AppstoreOutlined />,
    label: 'Loại sản phẩm',
  },
  {
    key: 'ingredients',
    icon: <DropboxOutlined />,
    label: 'Nguyên liệu',
  },
  {
    key: 'ingredientCategories',
    icon: <DropboxOutlined />,
    label: 'Loại nguyên liệu',
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
    icon: <ContactsOutlined />,
    label: 'Liên hệ',
  },
  {
    key: 'billing',
    icon: <FileTextOutlined />,
    label: 'Hóa đơn / In hóa đơn',
  },
];

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdmin(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ActivePage = pageMap[selectedKey] ?? Dashboard;

  if (loading) return <div>Đang kiểm tra phiên đăng nhập...</div>;
  if (!admin) return <AdminLogin onLogin={() => setAdmin(auth.currentUser)} />;

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
          Hệ thống quản lý tiệm bánh Vân Ngọc
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            <Suspense fallback={<PageFallback />}>
              <ActivePage />
            </Suspense>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
