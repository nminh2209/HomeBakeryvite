import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Spin, Alert } from 'antd';
import { Area } from '@ant-design/plots';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Order } from '../types/order';
import {
  computeRevenueByMonth,
  findLowStockIngredients,
  formatMonthLabel,
  DEFAULT_LOW_STOCK_THRESHOLD,
  type IngredientStockInput,
  type BillRevenueInput,
} from '../utils/dashboardStats';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [lowStock, setLowStock] = useState<
    { key: string; name: string; currentStock: number; minStock: number; unit?: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [counts, ordersSnap, billsSnap, ingredientsSnap] = await Promise.all([
          Promise.all(
            DASHBOARD_STAT_DEFS.map(async (def) => {
              const snap = await getDocs(collection(db, def.collection));
              return snap.size;
            }),
          ),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'bills')),
          getDocs(collection(db, 'ingredients')),
        ]);

        setStats(
          DASHBOARD_STAT_DEFS.map((def, idx) => ({
            title: def.title,
            value: def.value,
            count: counts[idx].toString(),
          })),
        );

        const orders: Order[] = ordersSnap.docs.map((d) => ({ key: d.id, ...d.data() } as Order));
        const bills: BillRevenueInput[] = billsSnap.docs.map((d) => {
          const data = d.data() as { date?: string; amount?: number; orderId?: string };
          return {
            date: data.date ?? '',
            amount: data.amount ?? 0,
            orderId: data.orderId,
          };
        });

        const revenueRows = computeRevenueByMonth(orders, bills);
        setRevenueData(
          revenueRows.map((r) => ({
            month: formatMonthLabel(r.month),
            revenue: r.revenue,
          })),
        );

        const ingredients: IngredientStockInput[] = ingredientsSnap.docs.map((d) => {
          const data = d.data() as {
            name?: string;
            currentStock?: number;
            minStock?: number;
            packagingUnit?: string;
          };
          return {
            name: data.name ?? d.id,
            currentStock: data.currentStock ?? 0,
            minStock: data.minStock,
            unit: data.packagingUnit,
          };
        });

        setLowStock(
          findLowStockIngredients(ingredients).map((row, idx) => ({
            key: String(idx),
            ...row,
          })),
        );
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenueChartConfig = useMemo(
    () => ({
      data: revenueData,
      xField: 'month',
      yField: 'revenue',
      shapeField: 'smooth',
      point: {
        shapeField: 'circle',
        size: 4,
        style: {
          fill: '#ffffff',
          stroke: '#b67c45',
          lineWidth: 2,
        },
      },
      style: {
        fill: 'linear-gradient(-90deg, rgba(182,124,69,0.35) 0%, rgba(182,124,69,0.05) 100%)',
      },
      line: {
        style: {
          stroke: '#b67c45',
          lineWidth: 3,
        },
      },
      axis: {
        x: {
          labelAutoRotate: false,
          labelSpacing: 8,
        },
        y: {
          labelFormatter: (v: number) => `${(v / 1_000_000).toFixed(1)}M`,
          grid: true,
        },
      },
      interaction: {
        tooltip: {
          render: (_: unknown, { title, items }: { title: string; items: { value: number }[] }) => ({
            title: `Tháng ${title}`,
            items: [
              {
                name: 'Doanh thu',
                value: `${(items?.[0]?.value ?? 0).toLocaleString('vi-VN')} ₫`,
              },
            ],
          }),
        },
      },
    }),
    [revenueData],
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" tip="Đang tải bảng điều khiển..." />
      </div>
    );
  }

  return (
    <div>
      <h2>Bảng điều khiển</h2>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Doanh thu theo tháng (đơn hàng + hóa đơn lẻ)">
            {revenueData.length > 0 ? (
              <Area {...revenueChartConfig} height={320} />
            ) : (
              <p style={{ color: '#888' }}>Chưa có dữ liệu doanh thu.</p>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={`Nguyên liệu sắp hết (theo minStock hoặc ≤ ${DEFAULT_LOW_STOCK_THRESHOLD})`}>
            <Table
              size="small"
              pagination={false}
              dataSource={lowStock}
              columns={[
                { title: 'Tên', dataIndex: 'name', key: 'name' },
                {
                  title: 'Tồn / Min',
                  key: 'stock',
                  render: (_: unknown, row: { currentStock: number; minStock: number; unit?: string }) =>
                    `${row.currentStock} / ${row.minStock}${row.unit ? ` ${row.unit}` : ''}`,
                },
              ]}
              locale={{ emptyText: 'Không có nguyên liệu dưới ngưỡng' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
