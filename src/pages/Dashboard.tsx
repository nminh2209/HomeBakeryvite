
import React from 'react';
import { Card, Row, Col } from 'antd';

const stats = [
  { title: 'Sản phẩm', value: 'Tổng số sản phẩm', count: '...' },
  { title: 'Đơn hàng', value: 'Tổng số đơn hàng', count: '...' },
  { title: 'Nhà cung cấp', value: 'Tổng số nhà cung cấp', count: '...' },
  { title: 'Nguyên liệu', value: 'Tổng số nguyên liệu', count: '...' },
  { title: 'Hóa đơn', value: 'Tổng số hóa đơn', count: '...' },
];

const Dashboard: React.FC = () => (
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

export default Dashboard;
