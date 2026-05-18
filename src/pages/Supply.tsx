

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Popconfirm, message, Select, Card, InputNumber } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { syncIngredientStockFromSupply } from '../utils/supplyStock';

interface PurchaseItem {
  ingredientId: string;
  ingredientName: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  packagingUnit: string;
  packagingValue: number;
}

interface SupplyOrder {
  key: string;
  orderDate: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  deliveryDate?: string;
  note?: string;
}

interface Supplier {
  key: string;
  name: string;
  phone: string;
  address: string;
}

interface Ingredient {
  key: string;
  name: string;
  brand: string;
  category: string;
  packagingValue: number;
  packagingUnit: string;
  currentStock: number;
  lastPurchaseDate?: string;
  lastUnitPrice?: number;
  note?: string;
}

const paymentStatusOptions = [
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'partial', label: 'Thanh toán một phần' },
  { value: 'paid', label: 'Đã thanh toán' },
];

const Supply: React.FC = () => {
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SupplyOrder | null>(null);
  const [form] = Form.useForm();
  const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');

  // Filter supply orders based on search text
  const filteredSupplyOrders = supplyOrders.filter(order => {
    const ingredientNames = order.items?.map(i => i.ingredientName).join(' ') || '';
    return order.supplierName.toLowerCase().includes(searchText.toLowerCase()) ||
           order.orderDate.includes(searchText) ||
           ingredientNames.toLowerCase().includes(searchText.toLowerCase()) ||
           (order.note && order.note.toLowerCase().includes(searchText.toLowerCase()));
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch supply orders
      const ordersSnapshot = await getDocs(collection(db, 'supplyOrders'));
      const ordersData: SupplyOrder[] = ordersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as SupplyOrder));
      setSupplyOrders(ordersData);
      
      // Fetch suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData: Supplier[] = suppliersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Supplier));
      setSuppliers(suppliersData);
      
      // Fetch ingredients
      const ingredientsSnapshot = await getDocs(collection(db, 'ingredients'));
      const ingredientsData: Ingredient[] = ingredientsSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Ingredient));
      setIngredients(ingredientsData);
    };
    fetchData();
  }, []);

  // Calculate totals
  const calculateTotals = (items: PurchaseItem[], discountValue: number) => {
    const subtotalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalValue = subtotalValue - discountValue;
    setSubtotal(subtotalValue);
    setTotal(totalValue);
  };

  // Add ingredient to purchase
  const addIngredientToPurchase = () => {
    const ingredientId = form.getFieldValue('selectedIngredient');
    const quantity = form.getFieldValue('selectedQuantity') || 1;
    const unitPrice = form.getFieldValue('unitPrice') || 0;
    const ingredient = ingredients.find(ing => ing.key === ingredientId);
    
    if (ingredient && quantity > 0 && unitPrice > 0) {
      const existingIndex = selectedItems.findIndex(item => item.ingredientId === ingredientId);
      let updatedItems: PurchaseItem[];
      
      if (existingIndex >= 0) {
        updatedItems = [...selectedItems];
        updatedItems[existingIndex].quantity += quantity;
        updatedItems[existingIndex].totalPrice = updatedItems[existingIndex].quantity * unitPrice;
      } else {
        const newItem: PurchaseItem = {
          ingredientId: ingredient.key,
          ingredientName: ingredient.name,
          brand: ingredient.brand,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice,
          packagingUnit: ingredient.packagingUnit,
          packagingValue: ingredient.packagingValue,
        };
        updatedItems = [...selectedItems, newItem];
      }
      
      setSelectedItems(updatedItems);
      calculateTotals(updatedItems, discount);
      form.setFieldsValue({ selectedIngredient: undefined, selectedQuantity: 1, unitPrice: 0 });
    }
  };

  // Remove item from purchase
  const removeItemFromPurchase = (ingredientId: string) => {
    const updatedItems = selectedItems.filter(item => item.ingredientId !== ingredientId);
    setSelectedItems(updatedItems);
    calculateTotals(updatedItems, discount);
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setSelectedItems([]);
    setSubtotal(0);
    setDiscount(0);
    setTotal(0);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SupplyOrder) => {
    setEditingOrder(record);
    setSelectedItems(record.items || []);
    setSubtotal(record.subtotal || 0);
    setDiscount(record.discount || 0);
    setTotal(record.totalAmount || 0);
    form.setFieldsValue({ 
      ...record, 
      orderDate: dayjs(record.orderDate),
      deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    const order = supplyOrders.find((item) => item.key === key);
    if (!order) return;

    try {
      const updatedIngredients = await syncIngredientStockFromSupply(
        order.items ?? [],
        [],
        order.orderDate,
        ingredients,
      );
      setIngredients(updatedIngredients);
      await deleteDoc(doc(db, 'supplyOrders', key));
      setSupplyOrders((prev) => prev.filter((item) => item.key !== key));
      message.success('Đã xóa đơn mua hàng và cập nhật tồn kho!');
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Lỗi khi xóa đơn mua hàng!');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedItems.length === 0) {
        message.error('Vui lòng chọn ít nhất một nguyên liệu!');
        return;
      }
      
      const supplier = suppliers.find(s => s.key === values.supplierId);
      const orderData: Omit<SupplyOrder, 'key'> = {
        orderDate: values.orderDate.format('YYYY-MM-DD'),
        supplierId: values.supplierId,
        supplierName: supplier?.name || '',
        items: selectedItems,
        subtotal: subtotal,
        discount: discount,
        totalAmount: total,
        paymentStatus: values.paymentStatus,
        deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : undefined,
        note: values.note || '',
      };
      
      const oldItems = editingOrder?.items ?? [];
      const updatedIngredients = await syncIngredientStockFromSupply(
        oldItems,
        selectedItems,
        orderData.orderDate,
        ingredients,
      );
      setIngredients(updatedIngredients);

      if (editingOrder) {
        await updateDoc(doc(db, 'supplyOrders', editingOrder.key), orderData);
        setSupplyOrders((prev) =>
          prev.map((item) => (item.key === editingOrder.key ? { ...editingOrder, ...orderData } : item)),
        );
        message.success('Đã cập nhật đơn mua hàng và tồn kho nguyên liệu!');
      } else {
        const docRef = await addDoc(collection(db, 'supplyOrders'), orderData);
        setSupplyOrders((prev) => [...prev, { ...orderData, key: docRef.id }]);
        message.success('Đã thêm đơn mua hàng và cập nhật tồn kho nguyên liệu!');
      }
      setIsModalOpen(false);
      form.resetFields();
      setSelectedItems([]);
      setSubtotal(0);
      setDiscount(0);
      setTotal(0);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Lỗi khi lưu đơn mua hàng!');
    }
  };

  const columns = [
    {
      title: 'Thông tin đơn hàng',
      key: 'orderInfo',
      sorter: (a: SupplyOrder, b: SupplyOrder) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (_: any, record: SupplyOrder) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            <CalendarOutlined /> {record.orderDate}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Nhà CC: {record.supplierName}
          </div>
        </div>
      ),
    },
    {
      title: 'Nguyên liệu',
      dataIndex: 'items',
      key: 'items',
      sorter: (a: SupplyOrder, b: SupplyOrder) => {
        const aItems = a.items?.map(i => i.ingredientName).join(', ') || '';
        const bItems = b.items?.map(i => i.ingredientName).join(', ') || '';
        return aItems.localeCompare(bItems);
      },
      render: (items: PurchaseItem[]) => (
        <div>
          {items?.map((item, idx) => (
            <div key={idx} style={{ fontSize: 12, marginBottom: 2 }}>
              {item.ingredientName} ({item.brand}) x{item.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      key: 'total',
      sorter: (a: SupplyOrder, b: SupplyOrder) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (_: any, record: SupplyOrder) => (
        <div>
          <div><strong>{record.totalAmount?.toLocaleString('vi-VN')} VNĐ</strong></div>
          {record.discount > 0 && (
            <div style={{ fontSize: 11, color: '#666' }}>Giảm: {record.discount?.toLocaleString('vi-VN')} VNĐ</div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái TT',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      sorter: (a: SupplyOrder, b: SupplyOrder) => a.paymentStatus.localeCompare(b.paymentStatus),
      filters: [
        { text: 'Đã thanh toán', value: 'paid' },
        { text: 'Thanh toán một phần', value: 'partial' },
        { text: 'Chưa thanh toán', value: 'unpaid' },
      ],
      onFilter: (value: any, record: SupplyOrder) => record.paymentStatus === value,
      render: (status: string) => {
        const option = paymentStatusOptions.find(opt => opt.value === status);
        const colors: Record<string, string> = {
          paid: '#52c41a',
          partial: '#faad14',
          unpaid: '#f5222d'
        };
        return <span style={{ color: colors[status] }}><DollarOutlined /> {option?.label}</span>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: SupplyOrder) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa đơn mua hàng này?" onConfirm={() => handleDelete(record.key)} okText="Xóa" cancelText="Hủy">
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
        <ShoppingCartOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Cung ứng</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Chức năng:</strong> Quản lý đơn mua, 1 lần mua bao gồm nhiều nguyên liệu và từ nhà cung cấp khác nhau</p>
        <p><strong>Tính năng mới:</strong></p>
        <ul>
          <li>Mua nhiều nguyên liệu từ một nhà cung cấp trong 1 đơn</li>
          <li>Tính toán đơn giá cho từng đơn vị cơ bản để so sánh</li>
          <li>Theo dõi biến động giá theo thời gian</li>
          <li>Quản lý thanh toán và giao hàng</li>
        </ul>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm đơn mua hàng
        </Button>
        <Input
          placeholder="🔍 Tìm kiếm theo nhà cung cấp, ngày, nguyên liệu..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350, maxWidth: '100%' }}
          allowClear
        />
      </div>
      
      <Table 
        columns={columns} 
        dataSource={filteredSupplyOrders} 
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn mua hàng`
        }} 
      />
      
      <Modal
        title={editingOrder ? 'Cập nhật đơn mua hàng' : 'Thêm đơn mua hàng'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
      >
        <Form form={form} layout="vertical">
          {/* Order Information */}
          <Card title="Thông tin đơn hàng" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="orderDate"
                label="Ngày đặt hàng"
                rules={[{ required: true, message: 'Vui lòng chọn ngày đặt hàng!' }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                name="supplierId"
                label="Nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp!' }]}
                style={{ flex: 1 }}
              >
                <Select 
                  placeholder="Chọn nhà cung cấp"
                  options={suppliers.map(sup => ({
                    value: sup.key, 
                    label: `${sup.name} - ${sup.phone}`
                  }))}
                />
              </Form.Item>
            </div>
          </Card>

          {/* Ingredient Selection */}
          <Card title="Chọn nguyên liệu" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Form.Item name="selectedIngredient" style={{ flex: 2, marginBottom: 0 }}>
                <Select 
                  placeholder="Chọn nguyên liệu"
                  options={ingredients.map(ing => ({
                    value: ing.key, 
                    label: `${ing.name} (${ing.brand}) - ${ing.packagingValue}${ing.packagingUnit}`
                  }))}
                />
              </Form.Item>
              <Form.Item name="selectedQuantity" style={{ width: 80, marginBottom: 0 }}>
                <InputNumber min={1} defaultValue={1} placeholder="SL" />
              </Form.Item>
              <Form.Item name="unitPrice" style={{ width: 120, marginBottom: 0 }}>
                <InputNumber min={0} placeholder="Đơn giá" />
              </Form.Item>
              <Button type="primary" onClick={addIngredientToPurchase}>
                Thêm
              </Button>
            </div>
            
            {/* Selected Items List */}
            {selectedItems.length > 0 && (
              <div style={{ border: '1px solid #d9d9d9', padding: 8, borderRadius: 6, backgroundColor: '#fafafa' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Nguyên liệu đã chọn:</div>
                {selectedItems.map((item, idx) => {
                  const unitBasePrice = item.packagingValue > 0 ? item.unitPrice / item.packagingValue : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div>
                        <div><strong>{item.ingredientName}</strong> ({item.brand})</div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} VNĐ = {item.totalPrice.toLocaleString('vi-VN')} VNĐ
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>
                          Đơn giá/đvt: {unitBasePrice.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ
                        </div>
                      </div>
                      <Button 
                        size="small" 
                        danger 
                        type="text"
                        onClick={() => removeItemFromPurchase(item.ingredientId)}
                      >
                        Xóa
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Payment & Delivery */}
          <Card title="Thanh toán & Giao hàng" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="paymentStatus"
                label="Trạng thái thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán!' }]}
                style={{ flex: 1 }}
              >
                <Select options={paymentStatusOptions} />
              </Form.Item>
              <Form.Item
                name="deliveryDate"
                label="Ngày giao hàng dự kiến"
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>
            
            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea placeholder="Ghi chú thêm về đơn hàng (không bắt buộc)" rows={2} />
            </Form.Item>
            
            <Form.Item label="Giảm giá">
              <InputNumber 
                min={0} 
                value={discount}
                onChange={(value) => {
                  const discountValue = value || 0;
                  setDiscount(discountValue);
                  setTotal(subtotal - discountValue);
                }}
                style={{ width: '100%' }} 
                placeholder="Nhập số tiền giảm giá" 
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Card>

          {/* Order Summary */}
          {selectedItems.length > 0 && (
            <Card title="Tóm tắt đơn hàng" size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#52c41a' }}>
                  <span>Giảm giá:</span>
                  <span>-{discount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', borderTop: '1px solid #d9d9d9', paddingTop: 8 }}>
                <span>Tổng cộng:</span>
                <span style={{ color: '#1890ff' }}>{total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Supply;
