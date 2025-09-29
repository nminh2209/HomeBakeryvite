

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, message, Select, Card } from 'antd';
import { PlusOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Ingredient {
  key: string;
  name: string;
  category: string;
  brand: string;
  packagingValue: number;
  packagingUnit: string;
  currentStock: number;
  lastPurchaseDate?: string;
  lastUnitPrice?: number;
  note?: string;
}

interface IngredientCategory {
  key: string;
  name: string;
  description?: string;
}

const unitOptions = [
  { value: 'kg', label: 'Kg - Kilogram' },
  { value: 'g', label: 'g - Gram' },
  { value: 'l', label: 'L - Lít' },
  { value: 'ml', label: 'ml - Millilít' },
  { value: 'cai', label: 'Cái' },
  { value: 'hop', label: 'Hộp' },
  { value: 'thung', label: 'Thùng' },
];

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch ingredients
      const ingredientsSnapshot = await getDocs(collection(db, 'ingredients'));
      const ingredientsData: Ingredient[] = ingredientsSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Ingredient));
      setIngredients(ingredientsData);
      
      // Fetch categories
      const categoriesSnapshot = await getDocs(collection(db, 'ingredientCategories'));
      const categoriesData: IngredientCategory[] = categoriesSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as IngredientCategory));
      setCategories(categoriesData);
    };
    fetchData();
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
      render: (text: string, record: Ingredient) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <TagOutlined /> {categories.find(cat => cat.key === record.category)?.name || 'Chưa phân loại'}
          </div>
        </div>
      ),
    },
    {
      title: 'Hãng sản xuất',
      dataIndex: 'brand',
      key: 'brand',
      render: (text: string) => <span>{text || 'Chưa có'}</span>,
    },
    {
      title: 'Dạng đóng gói',
      key: 'packaging',
      render: (_: any, record: Ingredient) => (
        <span>{record.packagingValue} {record.packagingUnit}</span>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: Ingredient) => (
        <span style={{ color: stock < 10 ? '#ff4d4f' : '#000' }}>
          {stock} {record.packagingUnit}
        </span>
      ),
    },
    {
      title: 'Đơn giá gần nhất',
      dataIndex: 'lastUnitPrice',
      key: 'lastUnitPrice',
      render: (price: number, record: Ingredient) => {
        if (!price || !record.packagingValue) return 'Chưa có';
        const unitPrice = price / record.packagingValue;
        return (
          <div>
            <div>{price.toLocaleString('vi-VN')} VNĐ/{record.packagingUnit}</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              {unitPrice.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/đvt cơ bản
            </div>
          </div>
        );
      },
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
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '2vw' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <AppstoreOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Quản lý nguyên liệu</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý nguyên liệu với thông tin chi tiết về hãng, đóng gói, và giá</p>
        <p><strong>Tính năng:</strong></p>
        <ul>
          <li>Phân loại nguyên liệu theo danh mục</li>
          <li>Quản lý thông tin hãng sản xuất</li>
          <li>Theo dõi dạng đóng gói và tồn kho</li>
          <li>Tính toán đơn giá cho từng đơn vị cơ bản để so sánh</li>
        </ul>
      </Card>

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
            name="category"
            label="Loại nguyên liệu"
            rules={[{ required: true, message: 'Vui lòng chọn loại nguyên liệu!' }]}
          >
            <Select 
              placeholder="Chọn loại nguyên liệu"
              options={categories.map(cat => ({ value: cat.key, label: cat.name }))}
              prefix={<TagOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Tên nguyên liệu"
            rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu!' }]}
          >
            <Input placeholder="VD: Không đường, Có đường, Nguyên kem..." />
          </Form.Item>
          
          <Form.Item
            name="brand"
            label="Hãng sản xuất"
            rules={[{ required: true, message: 'Vui lòng nhập hãng sản xuất!' }]}
          >
            <Input placeholder="VD: TH TrueMilk, Vinamilk, Mộc Châu..." />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="packagingValue"
              label="Giá trị đóng gói"
              rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} placeholder="VD: 980, 1, 3" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="packagingUnit"
              label="Đơn vị tính"
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị!' }]}
              style={{ flex: 1 }}
            >
              <Select options={unitOptions} placeholder="Chọn đơn vị" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="currentStock"
            label="Số lượng tồn kho hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea placeholder="Ghi chú thêm về nguyên liệu (không bắt buộc)" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Ingredients;
