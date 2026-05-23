import { describe, expect, it } from 'vitest';
import {
  formatOrderSummary,
  getOrderLineItems,
  getOrderTotal,
  orderToBillStatus,
  type Order,
} from './order';

const multiProductOrder: Order = {
  key: '1',
  customer: 'Lan',
  date: '2026-05-01',
  products: [
    { productId: 'p1', productName: 'Bánh mì', quantity: 2, price: 10000, total: 20000 },
    { productId: 'p2', productName: 'Cupcake', quantity: 1, price: 15000, total: 15000 },
  ],
  subtotal: 35000,
  discount: 5000,
  total: 30000,
};

describe('getOrderLineItems', () => {
  it('returns products array when present', () => {
    expect(getOrderLineItems(multiProductOrder)).toHaveLength(2);
  });

  it('maps legacy single-product orders', () => {
    const legacy: Order = {
      key: '2',
      customer: 'A',
      date: '2026-01-01',
      product: 'Tiramisu',
      quantity: 3,
    };
    const items = getOrderLineItems(legacy);
    expect(items[0].productName).toBe('Tiramisu');
    expect(items[0].quantity).toBe(3);
  });
});

describe('getOrderTotal', () => {
  it('uses explicit total when set', () => {
    expect(getOrderTotal(multiProductOrder)).toBe(30000);
  });

  it('computes from line items minus discount when total missing', () => {
    const order: Order = {
      key: '3',
      customer: 'B',
      date: '2026-01-02',
      products: [{ productId: 'p', productName: 'X', quantity: 1, price: 10000, total: 10000 }],
      discount: 2000,
    };
    expect(getOrderTotal(order)).toBe(8000);
  });
});

describe('formatOrderSummary', () => {
  it('joins product lines', () => {
    expect(formatOrderSummary(multiProductOrder)).toContain('Bánh mì x2');
  });
});

describe('orderToBillStatus', () => {
  it('maps paid and unpaid', () => {
    expect(orderToBillStatus('paid')).toBe('paid');
    expect(orderToBillStatus('unpaid')).toBe('unpaid');
    expect(orderToBillStatus(undefined)).toBe('unpaid');
  });
});
