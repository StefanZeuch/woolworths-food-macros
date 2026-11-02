import { useEffect, useState } from 'react';
import type { ProductDetail } from '../types/product';

const chunkCache = new Map<number, Record<string, ProductDetail>>();
const chunkPromises = new Map<number, Promise<Record<string, ProductDetail>>>();

async function loadChunk(chunk: number): Promise<Record<string, ProductDetail>> {
  if (chunkCache.has(chunk)) {
    return chunkCache.get(chunk)!;
  }

  if (!chunkPromises.has(chunk)) {
    const promise = fetch(
      `${import.meta.env.BASE_URL}products-details/chunk-${chunk}.json`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load product details (${response.status})`);
        }
        const json = (await response.json()) as Record<string, ProductDetail>;
        chunkCache.set(chunk, json);
        return json;
      })
      .finally(() => {
        chunkPromises.delete(chunk);
      });

    chunkPromises.set(chunk, promise);
  }

  return chunkPromises.get(chunk)!;
}

interface UseProductDetailResult {
  detail: ProductDetail | null;
  loading: boolean;
  error: string | null;
}

export function useProductDetail(
  productId: string,
  chunk: number,
  enabled: boolean,
): UseProductDetailResult {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const chunkData = await loadChunk(chunk);
        if (!cancelled) {
          setDetail(chunkData[productId] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setError(
            err instanceof Error ? err.message : 'Failed to load product details',
          );
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
  }, [productId, chunk, enabled]);

  return { detail, loading, error };
}
