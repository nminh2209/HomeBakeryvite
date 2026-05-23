import { describe, expect, it } from 'vitest';
import {
  computeRevenueByMonth,
  findLowStockIngredients,
  formatMonthLabel,
  getLowStockThreshold,
} from './dashboardStats';
import type { Order } from '../types/order';

describe('computeRevenueByMonth', () => {
  it('aggregates orders and standalone bills by month', () => {
    const orders: Order[] = [
      { key: '1', customer: 'A', date: '2026-05-10', total: 100000 },
      { key: '2', customer: 'B', date: '2026-05-20', total: 50000 },
    ];
    const bills = [
      { date: '2026-05-15', amount: 30000 },
      { date: '2026-05-16', amount: 99999, orderId: '1' },
    ];
    const rows = computeRevenueByMonth(orders, bills);
    const may = rows.find((r) => r.month === '2026-05');
    expect(may?.revenue).toBe(180000);
    expect(may?.orderCount).toBe(2);
  });
});

describe('findLowStockIngredients', () => {
  it('uses per-ingredient minStock when set', () => {
    const rows = findLowStockIngredients([
      { name: 'Flour', currentStock: 3, minStock: 5 },
      { name: 'Sugar', currentStock: 8, minStock: 5 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Flour');
  });

  it('falls back to default threshold', () => {
    const rows = findLowStockIngredients([
      { name: 'Butter', currentStock: 2 },
      { name: 'Flour', currentStock: 50 },
    ]);
    expect(rows[0].name).toBe('Butter');
  });
});

describe('getLowStockThreshold', () => {
  it('prefers minStock over fallback', () => {
    expect(getLowStockThreshold({ name: 'X', currentStock: 1, minStock: 3 })).toBe(3);
  });
});

describe('formatMonthLabel', () => {
  it('formats YYYY-MM', () => {
    expect(formatMonthLabel('2026-05')).toBe('05/2026');
  });
});
