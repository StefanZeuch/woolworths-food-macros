import { useEffect, useState } from 'react';
import type { ProductsFile } from '../types/product';

interface UseProductsResult {
  data: ProductsFile | null;
  loading: boolean;
  error: string | null;
}

export function useProducts(): UseProductsResult {
  const [data, setData] = useState<ProductsFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}products.json`);
        if (!response.ok) {
          throw new Error(`Failed to load products (${response.status})`);
        }
        const json = (await response.json()) as ProductsFile;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
