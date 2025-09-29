

import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'antd';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: 'Sản phẩm', value: 'Tổng số sản phẩm', count: '...' },
    { title: 'Đơn hàng', value: 'Tổng số đơn hàng', count: '...' },
    { title: 'Nhà cung cấp', value: 'Tổng số nhà cung cấp', count: '...' },
    { title: 'Nguyên liệu', value: 'Tổng số nguyên liệu', count: '...' },
    { title: 'Hóa đơn', value: 'Tổng số hóa đơn', count: '...' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      const collections = [
        { name: 'products', idx: 0 },
        { name: 'orders', idx: 1 },
        { name: 'suppliers', idx: 2 },
        { name: 'ingredients', idx: 3 },
        { name: 'bills', idx: 4 },
      ];
      const newStats = [...stats];
      await Promise.all(collections.map(async (col) => {
        const snap = await getDocs(collection(db, col.name));
  newStats[col.idx].count = snap.size.toString();
      }));
      setStats(newStats);
    };
    fetchStats();
    // eslint-disable-next-line
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
      <p style={{ marginTop: 32 }}>Thống kê tổng quan về tiệm bánh. (Số liệu sẽ được cập nhật khi có dữ liệu thực tế.)</p>
    </div>
  );
};

export default Dashboard;
