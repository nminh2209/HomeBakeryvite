import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import { AppRouter } from './routes';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import 'antd/dist/reset.css';

const App: React.FC = () => {
  const [admin, setAdmin] = React.useState(auth.currentUser);
  const [loading, setLoading] = React.useState(true);

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
    <BrowserRouter>
      <AppRouter admin={admin} onLogout={() => setAdmin(null)} />
    </BrowserRouter>
  );
};

export default App;
