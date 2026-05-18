import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Popconfirm, message, Select, Upload } from 'antd';
import { PlusOutlined, PrinterOutlined, UploadOutlined, FacebookOutlined, InstagramOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import type { Order, OrderProduct } from '../types/order';
import {
  formatOrderSummary,
  getOrderLineItems,
  getOrderTotal,
  orderToBillStatus,
} from '../types/order';

const RECEIPT_INFO = {
  brand: 'Tiệm Bánh Vân Ngọc',
  phone: '0123 456 789',
  facebook: 'facebook.com/tiembanhminh',
  instagram: 'instagram.com/tiembanhminh',
  tiktok: 'tiktok.com/@tiembanhminh',
  address: '123 Đường Bánh Ngon, Quận 1, TP.HCM',
};

interface Bill {
  key: string;
  customer: string;
  customerPhone?: string;
  date: string;
  amount: number;
  subtotal?: number;
  discount?: number;
  status: string;
  note?: string;
  qrCode?: string;
  orderId?: string;
  lineItems?: OrderProduct[];
}

const statusOptions = [
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
];

function formatOrderOptionLabel(order: Order): string {
  const total = getOrderTotal(order);
  const summary = formatOrderSummary(order);
  return `${order.customer} — ${summary} — ${total.toLocaleString('vi-VN')} VNĐ (${order.date})`;
}

const Receipt: React.FC<{ bill: Bill }> = ({ bill }) => (
  <div
    id="print-receipt"
    style={{
      maxWidth: 360,
      width: '100%',
      margin: '0 auto',
      fontFamily: 'monospace',
      background: '#fff',
      padding: '4vw 3vw',
      borderRadius: 8,
      border: '1px dashed #aaa',
      boxSizing: 'border-box',
      fontSize: 'clamp(13px, 3vw, 16px)',
      minHeight: 0,
    }}
  >
    <div style={{ textAlign: 'center', marginBottom: '2vw' }}>
      <h2 style={{ margin: 0, fontSize: 'clamp(18px, 5vw, 24px)' }}>{RECEIPT_INFO.brand}</h2>
      <div style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>{RECEIPT_INFO.address}</div>
      <div style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>ĐT: {RECEIPT_INFO.phone}</div>
    </div>
    <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '2vw 0' }} />
    <div style={{ fontSize: 'clamp(13px, 3vw, 16px)', marginBottom: '2vw' }}>
      <div><b>Khách:</b> {bill.customer}</div>
      <div><b>Ngày:</b> {bill.date}</div>
      {bill.customerPhone && <div><b>SĐT:</b> {bill.customerPhone}</div>}
      {bill.lineItems && bill.lineItems.length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <div><b>Sản phẩm:</b></div>
          {bill.lineItems.map((item, idx) => (
            <div key={idx} style={{ fontSize: 12 }}>
              {item.productName} x{item.quantity} — {item.total.toLocaleString('vi-VN')} VNĐ
            </div>
          ))}
        </div>
      )}
      {bill.subtotal != null && (
        <div><b>Tạm tính:</b> {bill.subtotal.toLocaleString('vi-VN')} VNĐ</div>
      )}
      {bill.discount != null && bill.discount > 0 && (
        <div><b>Giảm giá:</b> -{bill.discount.toLocaleString('vi-VN')} VNĐ</div>
      )}
      <div><b>Tổng cộng:</b> {bill.amount.toLocaleString('vi-VN')} VNĐ</div>
      {bill.note && <div><b>Ghi chú:</b> {bill.note}</div>}
      <div><b>Trạng thái:</b> {statusOptions.find(opt => opt.value === bill.status)?.label}</div>
    </div>
    <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '2vw 0' }} />
    <div style={{ textAlign: 'center', fontSize: 'clamp(12px, 2.8vw, 15px)', marginBottom: '2vw', wordBreak: 'break-all' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ margin: '0 4px' }}><FacebookOutlined /> {RECEIPT_INFO.facebook}</span>
        <span style={{ margin: '0 4px' }}><InstagramOutlined /> {RECEIPT_INFO.instagram}</span>
        <span style={{ margin: '0 4px' }}>TikTok: {RECEIPT_INFO.tiktok}</span>
      </div>
    </div>
    <div style={{ textAlign: 'center', marginTop: '3vw' }}>
      {bill.qrCode && (
        <img
          src={bill.qrCode}
          alt="QR"
          style={{
            width: '32vw',
            maxWidth: 140,
            height: '32vw',
            maxHeight: 140,
            margin: '0 auto',
            display: 'block',
          }}
        />
      )}
      <div style={{ fontSize: 'clamp(11px, 2vw, 13px)', marginTop: 4 }}>Quét mã để thanh toán</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '2vw', color: '#888' }}>
      Cảm ơn quý khách!
    </div>
  </div>
);

const Billing: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  // Orders for bill generation
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');

  // Filter bills based on search text
  const filteredBills = bills.filter(bill =>
    bill.customer.toLowerCase().includes(searchText.toLowerCase()) ||
    bill.date.includes(searchText) ||
    bill.amount.toString().includes(searchText) ||
    (bill.note && bill.note.toLowerCase().includes(searchText.toLowerCase()))
  );

  useEffect(() => {
    const fetchBills = async () => {
      const querySnapshot = await getDocs(collection(db, 'bills'));
      const data: Bill[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Bill));
      setBills(data);
    };
    fetchBills();
    // Fetch orders for bill generation
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const data: Order[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Order));
      setOrders(data);
    };
    fetchOrders();
  }, []);

  const handleAdd = () => {
    setEditingBill(null);
    setSelectedOrder(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Open order selection modal
  const handleAddFromOrder = () => {
    setIsOrderModalOpen(true);
  };

  // When an order is selected, prefill bill form
  const handleSelectOrder = (orderKey: string) => {
    const order = orders.find((o) => o.key === orderKey);
    if (!order) return;

    const productNote = formatOrderSummary(order);
    setSelectedOrder(order);
    form.setFieldsValue({
      customer: order.customer,
      date: dayjs(order.date),
      amount: getOrderTotal(order),
      status: orderToBillStatus(order.paymentStatus),
      note: order.note ? `${order.note} | ${productNote}` : productNote,
    });
    setIsOrderModalOpen(false);
    setEditingBill(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: Bill) => {
    setEditingBill(record);
    setSelectedOrder(
      record.orderId ? orders.find((o) => o.key === record.orderId) ?? null : null,
    );
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'bills', key));
    setBills(bills.filter((item) => item.key !== key));
    message.success('Đã xóa hóa đơn!');
  };

  // Print only the receipt for a bill
  const handlePrintReceipt = (bill: Bill) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>In hóa đơn</title>');
      printWindow.document.write('<style>body{background:#fff;}@media print{@page{size:auto;margin:10mm;}}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(document.getElementById('receipt-content-' + bill.key)?.innerHTML || '');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  const handleOk = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();
      let qrCodeUrl = editingBill?.qrCode ?? '';
      if (values.qrCode && values.qrCode[0]?.originFileObj) {
        const file = values.qrCode[0].originFileObj;
        qrCodeUrl = await uploadToCloudinary(file);
      }

      const lineItems = selectedOrder
        ? getOrderLineItems(selectedOrder)
        : editingBill?.lineItems;

      const billData: Omit<Bill, 'key'> = {
        customer: values.customer,
        customerPhone: selectedOrder?.customerPhone ?? editingBill?.customerPhone,
        date: values.date.format('YYYY-MM-DD'),
        amount: values.amount,
        subtotal: selectedOrder?.subtotal ?? editingBill?.subtotal,
        discount: selectedOrder?.discount ?? editingBill?.discount,
        status: values.status,
        note: values.note || '',
        qrCode: qrCodeUrl || '',
        orderId: selectedOrder?.key ?? editingBill?.orderId,
        lineItems: lineItems?.length ? lineItems : undefined,
      };
      if (editingBill) {
        await updateDoc(doc(db, 'bills', editingBill.key), billData);
        setBills(bills.map((item) => item.key === editingBill.key ? { ...editingBill, ...billData } : item));
        message.success('Đã cập nhật hóa đơn!');
      } else {
        const docRef = await addDoc(collection(db, 'bills'), billData);
        setBills([...bills, { ...billData, key: docRef.id }]);
        message.success('Đã thêm hóa đơn!');
      }
      setIsModalOpen(false);
      setSelectedOrder(null);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu hóa đơn!');
    }
    setUploading(false);
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a: Bill, b: Bill) => a.customer.localeCompare(b.customer),
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Bill, b: Bill) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Bill, b: Bill) => a.amount - b.amount,
      render: (amount: number) => amount.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: Bill, b: Bill) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Đã thanh toán', value: 'paid' },
        { text: 'Chưa thanh toán', value: 'unpaid' },
      ],
      onFilter: (value: any, record: Bill) => record.status === value,
      render: (status: string) => statusOptions.find(opt => opt.value === status)?.label,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      sorter: (a: Bill, b: Bill) => (a.note || '').localeCompare(b.note || ''),
    },
    {
      title: 'QR Code',
      dataIndex: 'qrCode',
      key: 'qrCode',
      render: (img: string) => img ? <img src={img} alt="QR" style={{ width: 60, height: 60 }} /> : 'Không có',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Bill) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa hóa đơn này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
          <Button type="link" icon={<PrinterOutlined />} onClick={() => handlePrintReceipt(record)}>
            In hóa đơn
          </Button>
        </>
      ),
    },
  ];

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
  <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '2vw' }}>
      <h2>Quản lý hóa đơn</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm hóa đơn
        </Button>
        <Button onClick={handleAddFromOrder}>
          Tạo hóa đơn từ đơn hàng
        </Button>
        <Input
          placeholder="🔍 Tìm kiếm theo khách hàng, ngày, số tiền, ghi chú..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350, maxWidth: '100%' }}
          allowClear
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredBills} 
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} hóa đơn`
        }} 
      />
      {/* Hidden receipt containers for printing */}
      <div style={{ display: 'none' }}>
        {bills.map(bill => (
          <div key={bill.key} id={'receipt-content-' + bill.key}>
            <Receipt bill={bill} />
          </div>
        ))}
      </div>
      {/* Modal for selecting order */}
      <Modal
        title="Chọn đơn hàng để tạo hóa đơn"
        open={isOrderModalOpen}
        onCancel={() => setIsOrderModalOpen(false)}
        footer={null}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn đơn hàng"
          onChange={handleSelectOrder}
          showSearch
          optionFilterProp="label"
          options={orders.map((order) => ({
            value: order.key,
            label: formatOrderOptionLabel(order),
          }))}
        />
      </Modal>
      <Modal
        title={editingBill ? 'Cập nhật hóa đơn' : 'Thêm hóa đơn'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => { setIsModalOpen(false); setSelectedOrder(null); }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customer"
            label="Khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Số tiền (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
          <Form.Item name="qrCode" label="QR Code thanh toán" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload
              name="qrCode"
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh QR</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

}
export default Billing;
