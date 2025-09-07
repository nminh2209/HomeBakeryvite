

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Contact {
  key: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchContacts = async () => {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      const data: Contact[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Contact));
      setContacts(data);
    };
    fetchContacts();
  }, []);

  const handleAdd = () => {
    setEditingContact(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Contact) => {
    setEditingContact(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'contacts', key));
    setContacts(contacts.filter((item) => item.key !== key));
    message.success('Đã xóa liên hệ!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingContact) {
        await updateDoc(doc(db, 'contacts', editingContact.key), values);
        setContacts(contacts.map((item) => item.key === editingContact.key ? { ...editingContact, ...values } : item));
        message.success('Đã cập nhật liên hệ!');
      } else {
        const docRef = await addDoc(collection(db, 'contacts'), values);
        setContacts([...contacts, { ...values, key: docRef.id }]);
        message.success('Đã thêm liên hệ!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu liên hệ!');
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
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Contact) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa liên hệ này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <h2>Quản lý liên hệ</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm liên hệ
      </Button>
      <Table columns={columns} dataSource={contacts} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingContact ? 'Cập nhật liên hệ' : 'Thêm liên hệ'}
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
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Contacts;
