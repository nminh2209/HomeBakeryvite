

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Upload, message, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

interface Product {
  key: string;
  name: string;
  price: number;
  image?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  // Load products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data: Product[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Product));
      setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    await deleteDoc(doc(db, 'products', key));
    setProducts(products.filter((item) => item.key !== key));
    message.success('Đã xóa sản phẩm!');
  };

  const handleOk = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();
      let imageUrl = values.image;
      // Nếu có file ảnh mới upload
      if (values.image && values.image[0]?.originFileObj) {
        const file = values.image[0].originFileObj;
  imageUrl = await uploadToCloudinary(file);
      }
      const productData = {
        name: values.name,
        price: values.price,
        image: imageUrl || '',
      };
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.key), productData);
        setProducts(products.map((item) => item.key === editingProduct.key ? { ...editingProduct, ...productData } : item));
        message.success('Đã cập nhật sản phẩm!');
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        setProducts([...products, { ...productData, key: docRef.id }]);
        message.success('Đã thêm sản phẩm!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Lỗi khi lưu sản phẩm!');
    }
    setUploading(false);
  };

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
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
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <h2>Quản lý sản phẩm</h2>
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
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
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
