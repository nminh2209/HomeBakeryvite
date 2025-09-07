import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Popconfirm, message, Select, Upload } from 'antd';
import { PlusOutlined, PrinterOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Bill {
  key: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
  note?: string;
  qrCode?: string;
  orderId?: string;
}

interface Order {
  key: string;
  customer: string;
  product: string;
  quantity: number;
  date: string;
  status: string;
  note?: string;
}



const statusOptions = [
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
];

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
    form.resetFields();
    setIsModalOpen(true);
  };

  // Open order selection modal
  const handleAddFromOrder = () => {
    setIsOrderModalOpen(true);
  };

  // When an order is selected, prefill bill form
  const handleSelectOrder = (orderKey: string) => {
    const order = orders.find(o => o.key === orderKey);
    if (order) {
      setSelectedOrder(order);
      form.setFieldsValue({
        customer: order.customer,
        date: dayjs(order.date),
        amount: order.quantity * 10000, // Example: set amount, adjust as needed
        note: order.note || '',
      });
      setIsOrderModalOpen(false);
      setEditingBill(null);
      setIsModalOpen(true);
    }
  };

  const handleEdit = (record: Bill) => {
    setEditingBill(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'bills', key));
    setBills(bills.filter((item) => item.key !== key));
    message.success('Đã xóa hóa đơn!');
  };

  const handlePrint = () => {
    window.print();
    message.info('Đã gửi lệnh in hóa đơn!');
  };

  const handleOk = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();
      let qrCodeUrl = values.qrCode;
      if (values.qrCode && values.qrCode[0]?.originFileObj) {
        const file = values.qrCode[0].originFileObj;
        const storageRef = ref(storage, `bills/qr_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        qrCodeUrl = await getDownloadURL(storageRef);
      }
      const billData = {
        customer: values.customer,
        date: values.date.format('YYYY-MM-DD'),
        amount: values.amount,
        status: values.status,
        note: values.note || '',
        qrCode: qrCodeUrl || '',
        orderId: selectedOrder ? selectedOrder.key : undefined,
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
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => statusOptions.find(opt => opt.value === status)?.label,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
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
          <Button type="link" icon={<PrinterOutlined />} onClick={handlePrint}>
            In
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
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <h2>Quản lý hóa đơn</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16, marginRight: 8 }}>
        Thêm hóa đơn
      </Button>
      <Button onClick={handleAddFromOrder} style={{ marginBottom: 16 }}>
        Tạo hóa đơn từ đơn hàng
      </Button>
      <Table columns={columns} dataSource={bills} pagination={{ pageSize: 5 }} />
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
          options={orders.map(order => ({ value: order.key, label: `${order.customer} - ${order.product} (${order.date})` }))}
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
