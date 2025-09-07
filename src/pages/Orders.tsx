

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const data: Order[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Order));
      setOrders(data);
    };
    fetchOrders();
  }, []);

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    form.setFieldsValue({ ...record, date: dayjs(record.date) });
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'orders', key));
    setOrders(orders.filter((item) => item.key !== key));
    message.success('Đã xóa đơn hàng!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const orderData = { ...values, date: values.date.format('YYYY-MM-DD') };
      if (editingOrder) {
        await updateDoc(doc(db, 'orders', editingOrder.key), orderData);
        setOrders(orders.map((item) => item.key === editingOrder.key ? { ...editingOrder, ...orderData } : item));
        message.success('Đã cập nhật đơn hàng!');
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setOrders([...orders, { ...orderData, key: docRef.id }]);
        message.success('Đã thêm đơn hàng!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu đơn hàng!');
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
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
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Order) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa đơn hàng này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '2vw' }}>
      <h2>Quản lý đơn hàng</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm đơn hàng
      </Button>
      <Table columns={columns} dataSource={orders} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingOrder ? 'Cập nhật đơn hàng' : 'Thêm đơn hàng'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
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
            name="product"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
