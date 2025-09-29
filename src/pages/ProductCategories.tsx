import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface ProductCategory {
  key: string;
  name: string;
  description?: string;
}

const ProductCategories: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, 'productCategories'));
      const data: ProductCategory[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as ProductCategory));
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: ProductCategory) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'productCategories', key));
    setCategories(categories.filter((item) => item.key !== key));
    message.success('Đã xóa loại sản phẩm!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const categoryData = values;

      if (editingCategory) {
        await updateDoc(doc(db, 'productCategories', editingCategory.key), categoryData);
        setCategories(categories.map((item) => item.key === editingCategory.key ? { ...editingCategory, ...categoryData } : item));
        message.success('Đã cập nhật loại sản phẩm!');
      } else {
        const docRef = await addDoc(collection(db, 'productCategories'), categoryData);
        setCategories([...categories, { ...categoryData, key: docRef.id }]);
        message.success('Đã thêm loại sản phẩm!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu loại sản phẩm!');
    }
  };

  const columns = [
    {
      title: 'Tên loại sản phẩm',
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
      render: (_: any, record: ProductCategory) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa loại sản phẩm này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
        <h2 style={{ margin: 0 }}>Loại sản phẩm</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý các loại sản phẩm (trường cha của tên sản phẩm)</p>
        <p><strong>Ví dụ:</strong> Tiramisu, Cheesecake, Bánh mì, Bánh ngọt, v.v.</p>
        <p><strong>Lưu ý:</strong> Mỗi sản phẩm sẽ thuộc về một loại sản phẩm cụ thể</p>
      </Card>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm loại sản phẩm
      </Button>
      
      <Table columns={columns} dataSource={categories} pagination={{ pageSize: 5 }} />
      
      <Modal
        title={editingCategory ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên loại sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại sản phẩm!' }]}
          >
            <Input 
              prefix={<TagOutlined />} 
              placeholder="VD: Tiramisu, Cheesecake, Bánh mì..." 
            />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea 
              placeholder="Mô tả chi tiết về loại sản phẩm này (không bắt buộc)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductCategories;