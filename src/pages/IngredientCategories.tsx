import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface IngredientCategory {
  key: string;
  name: string;
  description?: string;
}

const IngredientCategories: React.FC = () => {
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, 'ingredientCategories'));
      const data: IngredientCategory[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as IngredientCategory));
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: IngredientCategory) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'ingredientCategories', key));
    setCategories(categories.filter((item) => item.key !== key));
    message.success('Đã xóa loại nguyên liệu!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const categoryData = values;

      if (editingCategory) {
        await updateDoc(doc(db, 'ingredientCategories', editingCategory.key), categoryData);
        setCategories(categories.map((item) => item.key === editingCategory.key ? { ...editingCategory, ...categoryData } : item));
        message.success('Đã cập nhật loại nguyên liệu!');
      } else {
        const docRef = await addDoc(collection(db, 'ingredientCategories'), categoryData);
        setCategories([...categories, { ...categoryData, key: docRef.id }]);
        message.success('Đã thêm loại nguyên liệu!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu loại nguyên liệu!');
    }
  };

  const columns = [
    {
      title: 'Tên loại nguyên liệu',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span>
          <TagOutlined style={{ marginRight: 8 }} />
          <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || 'Không có mô tả',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: IngredientCategory) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa loại nguyên liệu này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
        <AppstoreOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Loại nguyên liệu</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý các loại nguyên liệu (trường cha của tên nguyên liệu)</p>
        <p><strong>Ví dụ:</strong> Sữa tươi, Bột mì, Đường, Trứng, Bơ, v.v.</p>
        <p><strong>Lưu ý:</strong> Mỗi nguyên liệu sẽ thuộc về một loại nguyên liệu cụ thể</p>
      </Card>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm loại nguyên liệu
      </Button>
      
      <Table columns={columns} dataSource={categories} pagination={{ pageSize: 5 }} />
      
      <Modal
        title={editingCategory ? 'Cập nhật loại nguyên liệu' : 'Thêm loại nguyên liệu'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên loại nguyên liệu"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại nguyên liệu!' }]}
          >
            <Input 
              prefix={<TagOutlined />} 
              placeholder="VD: Sữa tươi, Bột mì, Đường..." 
            />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea 
              placeholder="Mô tả chi tiết về loại nguyên liệu này (không bắt buộc)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IngredientCategories;