import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface StockLineItem {
  ingredientId: string;
  quantity: number;
  unitPrice?: number;
}

export interface IngredientStockRow {
  key: string;
  currentStock: number;
  lastUnitPrice?: number;
  lastPurchaseDate?: string;
}

/** Sum quantities per ingredient id. */
export function aggregateStockQuantities(items: StockLineItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.ingredientId, (map.get(item.ingredientId) ?? 0) + item.quantity);
  }
  return map;
}

/**
 * Apply stock delta when a supply order is created, updated, or deleted.
 * newItems minus oldItems → adjust currentStock; positive deltas update last purchase fields.
 */
export async function syncIngredientStockFromSupply<T extends IngredientStockRow>(
  oldItems: StockLineItem[],
  newItems: StockLineItem[],
  orderDate: string,
  ingredients: T[],
): Promise<T[]> {
  const oldAgg = aggregateStockQuantities(oldItems);
  const newAgg = aggregateStockQuantities(newItems);
  const ingredientIds = new Set([...oldAgg.keys(), ...newAgg.keys()]);

  const patches = new Map<string, Partial<T>>();

  for (const id of ingredientIds) {
    const delta = (newAgg.get(id) ?? 0) - (oldAgg.get(id) ?? 0);
    if (delta === 0) continue;

    const ing = ingredients.find((i) => i.key === id);
    if (!ing) continue;

    const nextStock = ing.currentStock + delta;
    const firestorePatch: {
      currentStock: number;
      lastUnitPrice?: number;
      lastPurchaseDate?: string;
    } = { currentStock: nextStock };
    const localPatch: Partial<T> = { currentStock: nextStock } as Partial<T>;

    if (delta > 0) {
      const line = newItems.find((item) => item.ingredientId === id);
      if (line?.unitPrice != null) {
        firestorePatch.lastUnitPrice = line.unitPrice;
        firestorePatch.lastPurchaseDate = orderDate;
        (localPatch as IngredientStockRow).lastUnitPrice = line.unitPrice;
        (localPatch as IngredientStockRow).lastPurchaseDate = orderDate;
      }
    }

    await updateDoc(doc(db, 'ingredients', id), firestorePatch);
    patches.set(id, localPatch);
  }

  return ingredients.map((ing) => (patches.has(ing.key) ? { ...ing, ...patches.get(ing.key) } : ing));
}
