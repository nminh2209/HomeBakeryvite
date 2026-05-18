import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'antd';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DASHBOARD_STAT_DEFS = [
  { title: 'Sản phẩm', value: 'Tổng số sản phẩm', collection: 'products' },
  { title: 'Đơn hàng', value: 'Tổng số đơn hàng', collection: 'orders' },
  { title: 'Nhà cung cấp', value: 'Tổng số nhà cung cấp', collection: 'suppliers' },
  { title: 'Nguyên liệu', value: 'Tổng số nguyên liệu', collection: 'ingredients' },
  { title: 'Hóa đơn', value: 'Tổng số hóa đơn', collection: 'bills' },
] as const;

type DashboardStat = {
  title: string;
  value: string;
  count: string;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStat[]>(() =>
    DASHBOARD_STAT_DEFS.map((def) => ({ title: def.title, value: def.value, count: '...' })),
  );

  useEffect(() => {
    const fetchStats = async () => {
      const counts = await Promise.all(
        DASHBOARD_STAT_DEFS.map(async (def) => {
          const snap = await getDocs(collection(db, def.collection));
          return snap.size;
        }),
      );

      setStats(
        DASHBOARD_STAT_DEFS.map((def, idx) => ({
          title: def.title,
          value: def.value,
          count: counts[idx].toString(),
        })),
      );
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2>Bảng điều khiển</h2>
      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} md={8} lg={6} key={stat.title}>
            <Card title={stat.title} bordered={false} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>{stat.count}</div>
              <div>{stat.value}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <p style={{ marginTop: 32 }}>
        Thống kê tổng quan về tiệm bánh. (Số liệu sẽ được cập nhật khi có dữ liệu thực tế.)
      </p>
    </div>
  );
};

export default Dashboard;
