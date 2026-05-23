

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, ContactsOutlined, PhoneOutlined, MailOutlined, HomeOutlined, SearchOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { normalizePhone } from '../utils/phone';

interface Supplier {
  key: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  contactPerson?: string;
  paymentTerms?: string;
  deliveryTime?: string;
  minOrderAmount?: number;
  preferredIngredients?: string[];
  lastOrderDate?: string;
  totalOrders?: number;
  note?: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Filter suppliers based on search text
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
    supplier.phone.includes(searchText) ||
    supplier.address.toLowerCase().includes(searchText.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchText.toLowerCase())) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchText.toLowerCase())) ||
    (supplier.paymentTerms && supplier.paymentTerms.toLowerCase().includes(searchText.toLowerCase()))
  );

  useEffect(() => {
    const fetchSuppliers = async () => {
      const querySnapshot = await getDocs(collection(db, 'suppliers'));
      const data: Supplier[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Supplier));
      setSuppliers(data);
    };
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'suppliers', key));
    setSuppliers(suppliers.filter((item) => item.key !== key));
    message.success('Đã xóa nhà cung cấp!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const supplierData = {
        ...values,
        phone: normalizePhone(values.phone),
      };
      
      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.key), supplierData);
        setSuppliers(suppliers.map((item) => item.key === editingSupplier.key ? { ...editingSupplier, ...supplierData } : item));
        message.success('Đã cập nhật nhà cung cấp!');
      } else {
        const docRef = await addDoc(collection(db, 'suppliers'), supplierData);
        setSuppliers([...suppliers, { ...supplierData, key: docRef.id }]);
        message.success('Đã thêm nhà cung cấp!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu nhà cung cấp!');
    }
  };

  const columns = [
    {
      title: 'Thông tin nhà cung cấp',
      key: 'info',
      sorter: (a: Supplier, b: Supplier) => a.name.localeCompare(b.name),
      defaultSortOrder: 'ascend' as const,
      render: (_: any, record: Supplier) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            <ContactsOutlined /> {record.name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <PhoneOutlined /> {record.phone}
          </div>
          {record.email && (
            <div style={{ fontSize: 12, color: '#666' }}>
              <MailOutlined /> {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Địa chỉ & Liên hệ',
      key: 'contact',
      render: (_: any, record: Supplier) => (
        <div>
          <div style={{ fontSize: 12, marginBottom: 2 }}>
            <HomeOutlined /> {record.address}
          </div>
          {record.contactPerson && (
            <div style={{ fontSize: 12, color: '#666' }}>Liên hệ: {record.contactPerson}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Điều kiện giao dịch',
      key: 'terms',
      render: (_: any, record: Supplier) => (
        <div style={{ fontSize: 12 }}>
          {record.paymentTerms && <div>TT: {record.paymentTerms}</div>}
          {record.deliveryTime && <div>Giao: {record.deliveryTime}</div>}
          {record.minOrderAmount && (
            <div>Tối thiểu: {record.minOrderAmount.toLocaleString('vi-VN')} VNĐ</div>
          )}
        </div>
      ),
    },
    {
      title: 'Lịch sử đặt hàng',
      key: 'history',
      render: (_: any, record: Supplier) => (
        <div style={{ fontSize: 12 }}>
          <div>Tổng: {record.totalOrders || 0} đơn</div>
          {record.lastOrderDate && <div>Gần nhất: {record.lastOrderDate}</div>}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Supplier) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa nhà cung cấp này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
        <ContactsOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Quản lý nhà cung cấp</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý, chỉnh sửa thông tin nhà cung cấp</p>
        <p><strong>Tính năng mới:</strong></p>
        <ul>
          <li>Chuẩn hóa số điện thoại (bắt đầu bằng 0)</li>
          <li>Quản lý điều kiện thanh toán và giao hàng</li>
          <li>Theo dõi lịch sử đặt hàng</li>
          <li>Tự động xuất hiện trong danh sách chọn nhà cung cấp ở phần Cung ứng</li>
        </ul>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm nhà cung cấp
        </Button>
        <Input
          placeholder="🔍 Tìm kiếm theo tên, điện thoại, địa chỉ, email, điều kiện..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350, maxWidth: '100%' }}
          allowClear
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredSuppliers} 
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhà cung cấp`
        }} 
      />
      <Modal
        title={editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="name"
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<ContactsOutlined />} />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9+\-\s\(\)]+$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
              style={{ flex: 1 }}
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
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<MailOutlined />} placeholder="email@example.com" />
            </Form.Item>
            <Form.Item
              name="contactPerson"
              label="Người liên hệ"
              style={{ flex: 1 }}
            >
              <Input placeholder="Tên người liên hệ" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="Địa chỉ nhà cung cấp" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="paymentTerms"
              label="Điều kiện thanh toán"
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: Thanh toán sau 30 ngày, Tiền mặt..." />
            </Form.Item>
            <Form.Item
              name="deliveryTime"
              label="Thời gian giao hàng"
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: 2-3 ngày, 1 tuần..." />
            </Form.Item>
          </div>
          
          <Form.Item
            name="minOrderAmount"
            label="Số tiền đặt hàng tối thiểu"
          >
            <Input placeholder="VD: 500000 (VNĐ)" />
          </Form.Item>
          
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea placeholder="Ghi chú thêm về nhà cung cấp (không bắt buộc)" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;
