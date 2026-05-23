import { describe, expect, it, vi, beforeEach } from 'vitest';
import { aggregateStockQuantities, syncIngredientStockFromSupply } from './supplyStock';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, col, id) => ({ col, id })),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

describe('aggregateStockQuantities', () => {
  it('sums quantities per ingredient', () => {
    const map = aggregateStockQuantities([
      { ingredientId: 'a', quantity: 2 },
      { ingredientId: 'a', quantity: 3 },
      { ingredientId: 'b', quantity: 1 },
    ]);
    expect(map.get('a')).toBe(5);
    expect(map.get('b')).toBe(1);
  });
});

describe('syncIngredientStockFromSupply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increases stock on new supply lines', async () => {
    const ingredients = [
      { key: 'ing1', currentStock: 10, name: 'Flour' },
    ];
    const result = await syncIngredientStockFromSupply(
      [],
      [{ ingredientId: 'ing1', quantity: 5, unitPrice: 12000 }],
      '2026-05-20',
      ingredients,
    );
    const updated = result[0] as { currentStock: number; lastUnitPrice?: number; lastPurchaseDate?: string };
    expect(updated.currentStock).toBe(15);
    expect(updated.lastUnitPrice).toBe(12000);
    expect(updated.lastPurchaseDate).toBe('2026-05-20');
  });

  it('applies delta when editing supply order', async () => {
    const ingredients = [{ key: 'ing1', currentStock: 20 }];
    const result = await syncIngredientStockFromSupply(
      [{ ingredientId: 'ing1', quantity: 10 }],
      [{ ingredientId: 'ing1', quantity: 7 }],
      '2026-05-21',
      ingredients,
    );
    expect(result[0].currentStock).toBe(17);
  });

  it('reverses stock on delete (old items only)', async () => {
    const ingredients = [{ key: 'ing1', currentStock: 20 }];
    const result = await syncIngredientStockFromSupply(
      [{ ingredientId: 'ing1', quantity: 5 }],
      [],
      '2026-05-21',
      ingredients,
    );
    expect(result[0].currentStock).toBe(15);
  });
});
