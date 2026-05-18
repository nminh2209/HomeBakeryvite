/** Line item shape stored on orders and bills (Firestore). */
export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

/** Current orders schema (+ optional legacy single-product fields). */
export interface Order {
  key: string;
  customer: string;
  customerPhone?: string;
  customerAddress?: string;
  products?: OrderProduct[];
  subtotal?: number;
  discount?: number;
  total?: number;
  date: string;
  paymentStatus?: 'paid' | 'unpaid';
  note?: string;
  /** @deprecated Legacy single-product orders */
  product?: string;
  quantity?: number;
}

export function getOrderLineItems(order: Order): OrderProduct[] {
  if (order.products?.length) return order.products;
  if (order.product) {
    const qty = order.quantity ?? 1;
    return [
      {
        productId: '',
        productName: order.product,
        quantity: qty,
        price: 0,
        total: 0,
      },
    ];
  }
  return [];
}

export function getOrderTotal(order: Order): number {
  if (typeof order.total === 'number') return order.total;
  const items = getOrderLineItems(order);
  const subtotal = items.reduce((sum, p) => sum + (p.total || p.price * p.quantity), 0);
  return subtotal - (order.discount ?? 0);
}

export function formatOrderSummary(order: Order): string {
  const items = getOrderLineItems(order);
  if (!items.length) return 'Không có sản phẩm';
  return items.map((p) => `${p.productName} x${p.quantity}`).join(', ');
}

export function orderToBillStatus(paymentStatus?: Order['paymentStatus']): 'paid' | 'unpaid' {
  return paymentStatus === 'paid' ? 'paid' : 'unpaid';
}
