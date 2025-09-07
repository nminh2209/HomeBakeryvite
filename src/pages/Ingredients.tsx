

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Ingredient {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchIngredients = async () => {
      const querySnapshot = await getDocs(collection(db, 'ingredients'));
      const data: Ingredient[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Ingredient));
      setIngredients(data);
    };
    fetchIngredients();
  }, []);

  const handleAdd = () => {
    setEditingIngredient(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Ingredient) => {
    setEditingIngredient(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'ingredients', key));
    setIngredients(ingredients.filter((item) => item.key !== key));
    message.success('Đã xóa nguyên liệu!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingIngredient) {
        await updateDoc(doc(db, 'ingredients', editingIngredient.key), values);
        setIngredients(ingredients.map((item) => item.key === editingIngredient.key ? { ...editingIngredient, ...values } : item));
        message.success('Đã cập nhật nguyên liệu!');
      } else {
        const docRef = await addDoc(collection(db, 'ingredients'), values);
        setIngredients([...ingredients, { ...values, key: docRef.id }]);
        message.success('Đã thêm nguyên liệu!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu nguyên liệu!');
    }
  };

  const columns = [
    {
      title: 'Tên nguyên liệu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Ingredient) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa nguyên liệu này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
      <h2>Quản lý nguyên liệu</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm nguyên liệu
      </Button>
      <Table columns={columns} dataSource={ingredients} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingIngredient ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên nguyên liệu"
            rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Đơn vị"
            rules={[{ required: true, message: 'Vui lòng nhập đơn vị!' }]}
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

export default Ingredients;
