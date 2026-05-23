import { Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PhoneOutlined, UserOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import type { Order, OrderProduct } from '../types/order';

const paymentStatusOptions = [
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
] as const;

export type OrderColumnHandlers = {
  onEdit: (record: Order) => void;
  onDelete: (key: string) => void;
};

export const buildOrderColumns = ({
  onEdit,
  onDelete,
}: OrderColumnHandlers): ColumnsType<Order> => [
  {
    title: 'Khách hàng',
    dataIndex: 'customer',
    key: 'customer',
    sorter: (a, b) => a.customer.localeCompare(b.customer),
    render: (text: string, record) => (
      <div>
        <div>
          <UserOutlined /> {text}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          <PhoneOutlined /> {record.customerPhone}
        </div>
      </div>
    ),
  },
  {
    title: 'Sản phẩm',
    dataIndex: 'products',
    key: 'products',
    sorter: (a, b) => {
      const aProducts = a.products?.map((p) => p.productName).join(', ') || '';
      const bProducts = b.products?.map((p) => p.productName).join(', ') || '';
      return aProducts.localeCompare(bProducts);
    },
    render: (products: OrderProduct[] | undefined) => (
      <div>
        {products?.map((p, idx) => (
          <div key={idx} style={{ fontSize: 12 }}>
            {p.productName} x{p.quantity}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'total',
    key: 'total',
    sorter: (a, b) => (a.total || 0) - (b.total || 0),
    defaultSortOrder: 'descend',
    render: (total: number, record) => (
      <div>
        <div>
          <strong>{total?.toLocaleString('vi-VN')} VNĐ</strong>
        </div>
        {(record.discount ?? 0) > 0 && (
          <div style={{ fontSize: 11, color: '#666' }}>
            Giảm: {record.discount?.toLocaleString('vi-VN')} VNĐ
          </div>
        )}
      </div>
    ),
  },
  {
    title: 'Ngày',
    dataIndex: 'date',
    key: 'date',
    sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    defaultSortOrder: 'descend',
  },
  {
    title: 'Thanh toán',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    sorter: (a, b) => (a.paymentStatus ?? '').localeCompare(b.paymentStatus ?? ''),
    filters: [
      { text: 'Đã thanh toán', value: 'paid' },
      { text: 'Chưa thanh toán', value: 'unpaid' },
    ],
    onFilter: (value, record) => record.paymentStatus === value,
    render: (status: string) => {
      const option = paymentStatusOptions.find((opt) => opt.value === status);
      const color = status === 'paid' ? '#52c41a' : '#f5222d';
      return (
        <span style={{ color }}>
          <MoneyCollectOutlined /> {option?.label}
        </span>
      );
    },
  },
  {
    title: 'Hành động',
    key: 'action',
    render: (_: unknown, record) => (
      <>
        <Button type="link" onClick={() => onEdit(record)}>
          Sửa
        </Button>
        <Popconfirm
          title="Xóa đơn hàng này?"
          onConfirm={() => onDelete(record.key)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger>
            Xóa
          </Button>
        </Popconfirm>
      </>
    ),
  },
];
