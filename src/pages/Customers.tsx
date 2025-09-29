import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, UserOutlined, PhoneOutlined, HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Customer {
  key: string;
  name: string;
  phone: string;
  address: string;
  purchaseHistory?: string;
}

const normalizePhone = (phone: string): string => {
  // Normalize phone number to start with 0 (remove +84, spaces, etc.)
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84')) {
    normalized = '0' + normalized.slice(2);
  }
  return normalized;
};

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchCustomers = async () => {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const data: Customer[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    };
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'customers', key));
    setCustomers(customers.filter((item) => item.key !== key));
    message.success('Đã xóa khách hàng!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const customerData = {
        ...values,
        phone: normalizePhone(values.phone),
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.key), customerData);
        setCustomers(customers.map((item) => item.key === editingCustomer.key ? { ...editingCustomer, ...customerData } : item));
        message.success('Đã cập nhật khách hàng!');
      } else {
        const docRef = await addDoc(collection(db, 'customers'), customerData);
        setCustomers([...customers, { ...customerData, key: docRef.id }]);
        message.success('Đã thêm khách hàng!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu khách hàng!');
    }
  };

  const columns = [
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <span>
          <PhoneOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      render: (text: string) => (
        <span>
          <HomeOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: 'Lịch sử mua hàng',
      dataIndex: 'purchaseHistory',
      key: 'purchaseHistory',
      render: (text: string) => (
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          {text || 'Chưa có'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Customer) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa khách hàng này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <UserOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Quản lý khách hàng</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý, chỉnh sửa thông tin khách hàng</p>
        <p><strong>Lưu ý:</strong> Số điện thoại được chuẩn hóa (bắt đầu bằng 0, không cần +84)</p>
      </Card>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm khách hàng
      </Button>
      
      <Table columns={columns} dataSource={customers} pagination={{ pageSize: 5 }} />
      
      <Modal
        title={editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tên khách hàng" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9+\-\s\(\)]+$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="0123456789 (tự động chuẩn hóa)"
              onChange={(e) => {
                const normalized = normalizePhone(e.target.value);
                form.setFieldValue('phone', normalized);
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="Nhập địa chỉ" />
          </Form.Item>
          
          <Form.Item name="purchaseHistory" label="Lịch sử mua hàng">
            <Input.TextArea 
              placeholder="Ghi chú lịch sử mua hàng (không bắt buộc)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;