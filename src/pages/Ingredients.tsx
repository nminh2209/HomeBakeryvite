

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, message, Select, Card } from 'antd';
import { PlusOutlined, AppstoreOutlined, TagOutlined, SearchOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

interface Ingredient {
  key: string;
  name: string;
  category: string;
  brand: string;
  packagingValue: number;
  packagingUnit: string;
  currentStock: number;
  minStock?: number;
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
  const mapIngredient = useCallback(
    (id: string, data: Record<string, unknown>) => ({ key: id, ...data }) as Ingredient,
    [],
  );
  const { items: ingredients, loading: ingredientsLoading } = useFirestoreCollection(
    'ingredients',
    mapIngredient,
  );
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Filter ingredients based on search text
  const filteredIngredients = ingredients.filter(ingredient => {
    const categoryName = categories.find(cat => cat.key === ingredient.category)?.name || '';
    return ingredient.name.toLowerCase().includes(searchText.toLowerCase()) ||
           ingredient.brand.toLowerCase().includes(searchText.toLowerCase()) ||
           categoryName.toLowerCase().includes(searchText.toLowerCase()) ||
           ingredient.packagingUnit.toLowerCase().includes(searchText.toLowerCase()) ||
           (ingredient.note && ingredient.note.toLowerCase().includes(searchText.toLowerCase()));
  });

  useEffect(() => {
    getDocs(collection(db, 'ingredientCategories')).then((snap) => {
      setCategories(snap.docs.map((d) => ({ key: d.id, ...d.data() }) as IngredientCategory));
    });
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
    message.success('Đã xóa nguyên liệu!');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingIngredient) {
        await updateDoc(doc(db, 'ingredients', editingIngredient.key), values);
        message.success('Đã cập nhật nguyên liệu!');
      } else {
        await addDoc(collection(db, 'ingredients'), values);
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
      sorter: (a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name),
      defaultSortOrder: 'ascend' as const,
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
      sorter: (a: Ingredient, b: Ingredient) => (a.brand || '').localeCompare(b.brand || ''),
      render: (text: string) => <span>{text || 'Chưa có'}</span>,
    },
    {
      title: 'Dạng đóng gói',
      key: 'packaging',
      sorter: (a: Ingredient, b: Ingredient) => a.packagingValue - b.packagingValue,
      render: (_: any, record: Ingredient) => (
        <span>{record.packagingValue} {record.packagingUnit}</span>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      sorter: (a: Ingredient, b: Ingredient) => a.currentStock - b.currentStock,
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
      sorter: (a: Ingredient, b: Ingredient) => (a.lastUnitPrice || 0) - (b.lastUnitPrice || 0),
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

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm nguyên liệu
        </Button>
        <Input
          placeholder="🔍 Tìm kiếm theo tên, hãng, loại nguyên liệu, đơn vị..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350, maxWidth: '100%' }}
          allowClear
        />
      </div>
      <Table
        loading={ingredientsLoading}
        columns={columns}
        dataSource={filteredIngredients}
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nguyên liệu`
        }} 
      />
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

          <Form.Item
            name="minStock"
            label="Tồn tối thiểu (cảnh báo)"
            tooltip="Để trống = dùng ngưỡng mặc định 10 trên bảng điều khiển"
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
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
