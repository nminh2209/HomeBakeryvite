

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Upload, message, Popconfirm, Select, Card } from 'antd';
import { PlusOutlined, UploadOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

interface Product {
  key: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  productCode: string;
}

interface ProductCategory {
  key: string;
  name: string;
  description?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  // Load products and categories from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = productsSnapshot.docs.map(doc => ({ 
          key: doc.id, 
          ...doc.data() 
        } as Product));
        setProducts(productsData);
        
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'productCategories'));
        const categoriesData: ProductCategory[] = categoriesSnapshot.docs.map(doc => ({ 
          key: doc.id, 
          ...doc.data() 
        } as ProductCategory));
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        message.error('Lỗi khi tải dữ liệu!');
      }
    };
    fetchData();
  }, []);

  // Generate unique product code
  const generateProductCode = (categoryName: string, productName: string) => {
    const catCode = categoryName.substring(0, 3).toUpperCase();
    const prodCode = productName.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${catCode}-${prodCode}-${timestamp}`;
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    // Set form fields without the image field for editing
    const { image, ...otherFields } = record;
    form.setFieldsValue(otherFields);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteDoc(doc(db, 'products', key));
      setProducts(products.filter((item) => item.key !== key));
      message.success('Đã xóa sản phẩm!');
    } catch (err) {
      console.error('Error deleting product:', err);
      message.error('Lỗi khi xóa sản phẩm!');
    }
  };

  const handleOk = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();
      let imageUrl = editingProduct?.image || '';
      
      // Nếu có file ảnh mới upload
      if (values.image && values.image[0]?.originFileObj) {
        const file = values.image[0].originFileObj;
        imageUrl = await uploadToCloudinary(file);
      }
      const selectedCategory = categories.find(cat => cat.key === values.category);
      const productCode = editingProduct ? editingProduct.productCode : generateProductCode(
        selectedCategory?.name || 'PRD', 
        values.name
      );
      
      const productData = {
        name: values.name,
        price: values.price,
        image: imageUrl || '',
        category: values.category,
        productCode: productCode,
      };
      
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.key), productData);
        setProducts(products.map((item) => 
          item.key === editingProduct.key ? { ...editingProduct, ...productData } : item
        ));
        message.success('Đã cập nhật sản phẩm!');
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        setProducts([...products, { ...productData, key: docRef.id }]);
        message.success('Đã thêm sản phẩm!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      console.error('Error saving product:', err);
      message.error(`Lỗi khi lưu sản phẩm: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Mã sản phẩm',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại sản phẩm',
      dataIndex: 'category',
      key: 'category',
      render: (categoryKey: string) => {
        const category = categories.find(cat => cat.key === categoryKey);
        return category ? <span><TagOutlined /> {category.name}</span> : 'Chưa phân loại';
      },
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toLocaleString('vi-VN'),
    },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (img: string) =>
        img ? <img src={img} alt="product" style={{ width: 60, height: 40, objectFit: 'cover' }} /> : 'Không có',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Product) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '2vw' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <AppstoreOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Quản lý sản phẩm</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý sản phẩm với mã định danh duy nhất và phân loại</p>
        <p><strong>Mã sản phẩm:</strong> Tự động tạo theo định dạng: [LOẠI]-[TÊN]-[TIMESTAMP]</p>
        <p><strong>Ví dụ:</strong> TIR-MAT-1234 (Tiramisu Matcha), CHE-CLA-5678 (Cheesecake Classic)</p>
      </Card>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Thêm sản phẩm
      </Button>
      <Table columns={columns} dataSource={products} pagination={{ pageSize: 5 }} />
      <Modal
        title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category"
            label="Loại sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm!' }]}
          >
            <Select 
              placeholder="Chọn loại sản phẩm"
              options={categories.map(cat => ({ value: cat.key, label: cat.name }))}
              prefix={<TagOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
          >
            <Input placeholder="VD: Matcha, Classic, Xoài..." />
          </Form.Item>
          
          {editingProduct && (
            <Form.Item label="Mã sản phẩm">
              <Input value={editingProduct.productCode} disabled />
            </Form.Item>
          )}
          
          <Form.Item
            name="price"
            label="Giá bán"
            rules={[{ required: true, message: 'Vui lòng nhập giá bán!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="VNĐ" />
          </Form.Item>
          <Form.Item name="image" label="Ảnh sản phẩm" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload
              name="image"
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
