

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface SupplyItem {
  key: string;
  name: string;
  date: string;
  note?: string;
}

const Supply: React.FC = () => {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchSupplies = async () => {
      const querySnapshot = await getDocs(collection(db, 'supplies'));
      const data: SupplyItem[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as SupplyItem));
      setSupplies(data);
    };
    fetchSupplies();
  }, []);

  const handleAdd = () => {
    setEditingSupply(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SupplyItem) => {
    setEditingSupply(record);
    form.setFieldsValue({ ...record, date: dayjs(record.date) });
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'supplies', key));
    setSupplies(supplies.filter((item) => item.key !== key));
    message.success('Đã xóa cung ứng!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const supplyData = { ...values, date: values.date.format('YYYY-MM-DD') };
      if (editingSupply) {
        await updateDoc(doc(db, 'supplies', editingSupply.key), supplyData);
        setSupplies(supplies.map((item) => item.key === editingSupply.key ? { ...editingSupply, ...supplyData } : item));
        message.success('Đã cập nhật cung ứng!');
      } else {
        const docRef = await addDoc(collection(db, 'supplies'), supplyData);
        setSupplies([...supplies, { ...supplyData, key: docRef.id }]);
        message.success('Đã thêm cung ứng!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu cung ứng!');
    }
  };

  const columns = [
    {
      title: 'Tên cung ứng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: SupplyItem) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa cung ứng này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
      <h2>Quản lý cung ứng</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm cung ứng
      </Button>
      <Table columns={columns} dataSource={supplies} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingSupply ? 'Cập nhật cung ứng' : 'Thêm cung ứng'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên cung ứng"
            rules={[{ required: true, message: 'Vui lòng nhập tên cung ứng!' }]}
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
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Supply;
