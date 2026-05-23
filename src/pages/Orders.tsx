import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Card } from 'antd';
import { PlusOutlined, PhoneOutlined, UserOutlined, ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { normalizePhone } from '../utils/phone';
import { buildOrderColumns } from './ordersColumns';
import type { Order, OrderProduct } from '../types/order';

interface Customer {
  key: string;
  name: string;
  phone: string;
  address: string;
  purchaseHistory?: string;
}

interface Product {
  key: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  productCode: string;
}

const paymentStatusOptions = [
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');

  // Filter orders based on search text
  const filteredOrders = orders.filter(order =>
    order.customer.toLowerCase().includes(searchText.toLowerCase()) ||
    (order.customerPhone ?? '').includes(searchText) ||
    order.products?.some(p => p.productName.toLowerCase().includes(searchText.toLowerCase())) ||
    order.date.includes(searchText) ||
    (order.note && order.note.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Function to migrate existing customers from orders
  const migrateExistingCustomers = async () => {
    try {
      message.loading('Đang chuyển đổi khách hàng hiện tại...', 0);
      
      // Get all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders: Order[] = ordersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Order));
      
      // Get existing customers to avoid duplicates
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const existingCustomers: Customer[] = customersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Customer));
      const existingPhones = existingCustomers.map(c => c.phone);
      
      // Extract unique customers from orders
      const customerMap = new Map<string, {name: string; phone: string; address: string; orderDates: string[]}>();
      
      allOrders.forEach(order => {
        if (order.customer && order.customerPhone) {
          const phone = order.customerPhone;
          const existing = customerMap.get(phone);
          
          if (existing) {
            // Add this order date to existing customer
            existing.orderDates.push(order.date);
            // Update address if this order has a more recent address
            if (order.customerAddress) {
              existing.address = order.customerAddress;
            }
          } else {
            // New customer
            customerMap.set(phone, {
              name: order.customer,
              phone: phone,
              address: order.customerAddress || 'Chưa có địa chỉ',
              orderDates: [order.date]
            });
          }
        }
      });
      
      // Save new customers to Firebase
      let newCustomersCount = 0;
      let updatedCustomersCount = 0;
      
      for (const [phone, customerInfo] of customerMap) {
        if (!existingPhones.includes(phone)) {
          // New customer - save to database
          const customerDoc = {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address,
            purchaseHistory: `Đơn hàng: ${customerInfo.orderDates.sort().join(', ')}`,
          };
          
          await addDoc(collection(db, 'customers'), customerDoc);
          console.log(`Saved customer: ${customerInfo.name} (${phone})`);
          newCustomersCount++;
        } else {
          // Customer exists - update their purchase history
          const existingCustomer = existingCustomers.find(c => c.phone === phone);
          if (existingCustomer) {
            const updatedHistory = `${existingCustomer.purchaseHistory || ''}, ${customerInfo.orderDates.join(', ')}`;
            await updateDoc(doc(db, 'customers', existingCustomer.key), {
              purchaseHistory: updatedHistory,
              address: customerInfo.address, // Update address to latest
            });
            updatedCustomersCount++;
          }
        }
      }
      
      // Refresh the customer list
      const refreshedCustomersSnapshot = await getDocs(collection(db, 'customers'));
      const refreshedCustomersData: Customer[] = refreshedCustomersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Customer));
      setCustomers(refreshedCustomersData);
      
      message.destroy(); // Clear loading message
      message.success(`🎉 Hoàn thành! Đã thêm ${newCustomersCount} khách hàng mới và cập nhật ${updatedCustomersCount} khách hàng hiện tại từ ${allOrders.length} đơn hàng!`, 8);
      
    } catch (error) {
      message.destroy();
      console.error('Error migrating customers:', error);
      message.error(`❌ Lỗi khi chuyển đổi khách hàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = ordersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      
      // Fetch customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customersData: Customer[] = customersSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
      
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData: Product[] = productsSnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    };
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingOrder(null);
    setSelectedProducts([]);
    setSubtotal(0);
    setDiscount(0);
    setTotal(0);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((record: Order) => {
    setEditingOrder(record);
    setSelectedProducts(record.products || []);
    setSubtotal(record.subtotal || 0);
    setDiscount(record.discount || 0);
    setTotal(record.total || 0);
    form.setFieldsValue({ 
      ...record, 
      date: dayjs(record.date),
      customerPhone: record.customerPhone,
      customerAddress: record.customerAddress,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleDelete = useCallback(async (key: string) => {
    await deleteDoc(doc(db, 'orders', key));
    setOrders((prev) => prev.filter((item) => item.key !== key));
    message.success('Đã xóa đơn hàng!');
  }, []);

  // Helper function to save customer if they don't exist
  const saveCustomerIfNew = async (customerData: { name: string; phone: string; address: string }) => {
    try {
      console.log('Attempting to save customer:', customerData);
      
      // Check if customer already exists by phone number
      const existingCustomer = customers.find(c => c.phone === customerData.phone);
      console.log('Existing customer found:', existingCustomer);
      
      if (!existingCustomer) {
        // Customer doesn't exist, save to customers collection
        const customerDoc = {
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          purchaseHistory: `Đơn hàng đầu tiên: ${dayjs().format('YYYY-MM-DD')}`,
        };
        
        console.log('Saving new customer to Firebase:', customerDoc);
        const docRef = await addDoc(collection(db, 'customers'), customerDoc);
        console.log('Customer saved with ID:', docRef.id);
        
        // Update local customers state
        setCustomers([...customers, { ...customerDoc, key: docRef.id }]);
        
        message.success(`✅ Đã lưu khách hàng mới: ${customerData.name} vào "Quản lí khách hàng"! Hãy kiểm tra tab "Quản lí khách hàng" hoặc nhấn "Làm mới".`, 6);
      } else {
        // Customer exists, optionally update their purchase history
        const updatedHistory = existingCustomer.purchaseHistory 
          ? existingCustomer.purchaseHistory + `, ${dayjs().format('YYYY-MM-DD')}`
          : `Đơn hàng: ${dayjs().format('YYYY-MM-DD')}`;
        
        await updateDoc(doc(db, 'customers', existingCustomer.key), {
          address: customerData.address, // Update address in case it changed
          purchaseHistory: updatedHistory,
        });
        
        // Update local state
        setCustomers(customers.map(c => 
          c.key === existingCustomer.key 
            ? { ...c, address: customerData.address, purchaseHistory: updatedHistory }
            : c
        ));
        
        message.info(`📝 Đã cập nhật lịch sử mua hàng cho khách hàng: ${customerData.name}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      message.error(`❌ Lỗi khi lưu khách hàng: ${error instanceof Error ? error.message : 'Unknown error'}. Đơn hàng vẫn được tạo thành công.`);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedProducts.length === 0) {
        message.error('Vui lòng chọn ít nhất một sản phẩm!');
        return;
      }
      
      const finalPhone = normalizePhone(values.customerPhone);

      const orderData: Omit<Order, 'key'> = {
        customer: values.customer,
        customerPhone: finalPhone,
        customerAddress: values.customerAddress,
        products: selectedProducts,
        subtotal: subtotal,
        discount: discount,
        total: total,
        date: values.date.format('YYYY-MM-DD'),
        paymentStatus: values.paymentStatus as 'paid' | 'unpaid',
        note: values.note || '',
      };
      
      // Save customer information automatically (only for new orders, not edits)
      if (!editingOrder) {
        await saveCustomerIfNew({
          name: values.customer,
          phone: finalPhone,
          address: values.customerAddress,
        });
      }
      
      if (editingOrder) {
        await updateDoc(doc(db, 'orders', editingOrder.key), orderData);
        setOrders(orders.map((item) => item.key === editingOrder.key ? { ...editingOrder, ...orderData } : item));
        message.success('Đã cập nhật đơn hàng!');
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setOrders([...orders, { ...orderData, key: docRef.id }]);
        message.success('Đã thêm đơn hàng và lưu thông tin khách hàng!');
      }
      setIsModalOpen(false);
      form.resetFields();
      setSelectedProducts([]);
      setSubtotal(0);
      setDiscount(0);
      setTotal(0);
    } catch {
      message.error('Lỗi khi lưu đơn hàng!');
    }
  };

  const columns = useMemo(
    () =>
      buildOrderColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleEdit, handleDelete],
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '2vw' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <ShoppingCartOutlined style={{ fontSize: 24, marginRight: 8 }} />
        <h2 style={{ margin: 0 }}>Quản lý đơn hàng</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <p><strong>Tính năng mới:</strong></p>
        <ul>
          <li>✅ <strong>Tự động lưu khách hàng:</strong> Khách hàng mới sẽ được tự động thêm vào "Quản lí khách hàng"</li>
          <li>📞 Tự động điền thông tin khi nhập số điện thoại khách hàng cũ</li>
          <li>🛒 Cho phép chọn nhiều sản phẩm với số lượng khác nhau</li>
          <li>💰 Tính toán tự động: tạm tính, giảm giá, tổng tiền</li>
          <li>💳 Trạng thái thanh toán: đã thanh toán / chưa thanh toán</li>
        </ul>
        <p><strong>🔄 Chuyển đổi khách hàng hiện tại:</strong> Nhấn nút "Chuyển đổi khách hàng hiện tại" để tự động thêm tất cả khách hàng từ các đơn hàng cũ vào danh sách "Quản lí khách hàng".</p>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm đơn hàng
        </Button>
        <Button 
          onClick={migrateExistingCustomers}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
        >
          🔄 Chuyển đổi khách hàng hiện tại
        </Button>
        <Input
          placeholder="🔍 Tìm kiếm theo tên khách hàng, số điện thoại, sản phẩm, ngày..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350, maxWidth: '100%' }}
          allowClear
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredOrders} 
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`
        }} 
      />
      <Modal
        title={editingOrder ? 'Cập nhật đơn hàng' : 'Thêm đơn hàng'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
      >
        <Form form={form} layout="vertical">
          {/* Customer Information */}
          <Card 
            title="Thông tin khách hàng" 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              !editingOrder && (
                <span style={{ fontSize: 12, color: '#52c41a' }}>
                  ✅ Khách hàng mới sẽ được tự động lưu vào danh sách
                </span>
              )
            }
          >
            <Form.Item
              name="customerPhone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="0123456789 (tự động tìm khách hàng cũ)"
                onChange={(e) => {
                  const normalized = normalizePhone(e.target.value);
                  const customer = customers.find(c => c.phone === normalized);
                  if (customer) {
                    form.setFieldsValue({
                      customer: customer.name,
                      customerAddress: customer.address,
                    });
                    message.success(`Đã tìm thấy khách hàng: ${customer.name}`);
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="customer"
              label="Tên khách hàng"
              rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập tên khách hàng" />
            </Form.Item>
            <Form.Item
              name="customerAddress"
              label="Địa chỉ"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
            >
              <Input placeholder="Nhập địa chỉ giao hàng" />
            </Form.Item>
          </Card>

          {/* Product Selection */}
          <Card title="Chọn sản phẩm" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Form.Item name="selectedProduct" style={{ flex: 1, marginBottom: 0 }}>
                <Select 
                  placeholder="Chọn sản phẩm"
                  options={products.map(p => ({
                    value: p.key, 
                    label: `${p.name} - ${p.price.toLocaleString('vi-VN')} VNĐ`
                  }))}
                />
              </Form.Item>
              <Form.Item name="selectedQuantity" style={{ width: 80, marginBottom: 0 }}>
                <InputNumber min={1} defaultValue={1} />
              </Form.Item>
              <Button 
                type="primary" 
                onClick={() => {
                  const productId = form.getFieldValue('selectedProduct');
                  const quantity = form.getFieldValue('selectedQuantity') || 1;
                  const product = products.find(p => p.key === productId);
                  
                  if (product && quantity > 0) {
                    const existingIndex = selectedProducts.findIndex(p => p.productId === productId);
                    let updatedProducts: OrderProduct[];
                    
                    if (existingIndex >= 0) {
                      updatedProducts = [...selectedProducts];
                      updatedProducts[existingIndex].quantity += quantity;
                      updatedProducts[existingIndex].total = updatedProducts[existingIndex].quantity * product.price;
                    } else {
                      const newProduct: OrderProduct = {
                        productId: product.key,
                        productName: product.name,
                        quantity: quantity,
                        price: product.price,
                        total: quantity * product.price,
                      };
                      updatedProducts = [...selectedProducts, newProduct];
                    }
                    
                    setSelectedProducts(updatedProducts);
                    const newSubtotal = updatedProducts.reduce((sum, p) => sum + p.total, 0);
                    const newTotal = newSubtotal - discount;
                    setSubtotal(newSubtotal);
                    setTotal(newTotal);
                    form.setFieldsValue({ selectedProduct: undefined, selectedQuantity: 1 });
                  }
                }}
              >
                Thêm
              </Button>
            </div>
            
            {/* Selected Products List */}
            {selectedProducts.length > 0 && (
              <div style={{ border: '1px solid #d9d9d9', padding: 8, borderRadius: 6, backgroundColor: '#fafafa' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Sản phẩm đã chọn:</div>
                {selectedProducts.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span>{p.productName} x{p.quantity}</span>
                    <div>
                      <span style={{ marginRight: 8 }}>{p.total.toLocaleString('vi-VN')} VNĐ</span>
                      <Button 
                        size="small" 
                        danger 
                        type="text"
                        onClick={() => {
                          const updatedProducts = selectedProducts.filter(prod => prod.productId !== p.productId);
                          setSelectedProducts(updatedProducts);
                          const newSubtotal = updatedProducts.reduce((sum, prod) => sum + prod.total, 0);
                          const newTotal = newSubtotal - discount;
                          setSubtotal(newSubtotal);
                          setTotal(newTotal);
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Order Details */}
          <Card title="Chi tiết đơn hàng" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="date"
                label="Ngày"
                rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                name="paymentStatus"
                label="Trạng thái thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán!' }]}
                style={{ flex: 1 }}
              >
                <Select options={paymentStatusOptions} />
              </Form.Item>
            </div>
            
            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea placeholder="Ghi chú thêm (không bắt buộc)" rows={2} />
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
          {selectedProducts.length > 0 && (
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

export default Orders;
