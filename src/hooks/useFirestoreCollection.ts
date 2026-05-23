import { useEffect, useState } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Live Firestore list subscription (replaces getDocs + polling).
 */
export function useFirestoreCollection<T extends { key: string }>(
  collectionName: string,
  mapDoc: (id: string, data: DocumentData) => T,
): { items: T[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        setItems(snapshot.docs.map((d) => mapDoc(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`${collectionName} onSnapshot:`, err);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
    // mapDoc should be stable (useCallback in callers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { items, loading, error };
}
