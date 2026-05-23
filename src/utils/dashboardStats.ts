import type { Order } from '../types/order';
import { getOrderTotal } from '../types/order';

/** Fallback when ingredient has no minStock set in Firestore. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export interface RevenueByMonthRow {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface LowStockRow {
  name: string;
  currentStock: number;
  minStock: number;
  unit?: string;
}

export interface IngredientStockInput {
  name: string;
  currentStock: number;
  minStock?: number;
  unit?: string;
}

export interface BillRevenueInput {
  date: string;
  amount: number;
  /** Bills created from an order should not be counted again (orders already included). */
  orderId?: string;
}

/**
 * Revenue by month: all orders + standalone bills only (no orderId).
 * Avoids double-counting when a bill was generated from an order.
 */
export function computeRevenueByMonth(
  orders: Order[],
  bills: BillRevenueInput[],
): RevenueByMonthRow[] {
  const map = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of orders) {
    const month = order.date?.slice(0, 7);
    if (!month) continue;
    const entry = map.get(month) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += getOrderTotal(order);
    entry.orderCount += 1;
    map.set(month, entry);
  }

  for (const bill of bills) {
    if (bill.orderId) continue;
    const month = bill.date?.slice(0, 7);
    if (!month) continue;
    const entry = map.get(month) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += bill.amount ?? 0;
    map.set(month, entry);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orderCount: data.orderCount,
    }));
}

export function getLowStockThreshold(ingredient: IngredientStockInput, fallback = DEFAULT_LOW_STOCK_THRESHOLD): number {
  return ingredient.minStock ?? fallback;
}

export function findLowStockIngredients(
  ingredients: IngredientStockInput[],
  fallbackThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
): LowStockRow[] {
  return ingredients
    .filter((i) => i.currentStock <= getLowStockThreshold(i, fallbackThreshold))
    .sort((a, b) => a.currentStock - b.currentStock)
    .map((i) => ({
      name: i.name,
      currentStock: i.currentStock,
      minStock: getLowStockThreshold(i, fallbackThreshold),
      unit: i.unit,
    }));
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  return month && year ? `${month}/${year}` : ym;
}
