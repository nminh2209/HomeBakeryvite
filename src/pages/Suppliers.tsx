

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Supplier {
  key: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  note?: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

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
      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.key), values);
        setSuppliers(suppliers.map((item) => item.key === editingSupplier.key ? { ...editingSupplier, ...values } : item));
        message.success('Đã cập nhật nhà cung cấp!');
      } else {
        const docRef = await addDoc(collection(db, 'suppliers'), values);
        setSuppliers([...suppliers, { ...values, key: docRef.id }]);
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
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
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
      <h2>Quản lý nhà cung cấp</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm nhà cung cấp
      </Button>
      <Table columns={columns} dataSource={suppliers} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;
