import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { SlimProduct } from '../types/product';
import { getNutrientLabel } from '../utils/nutrition';
import { ProductRow } from './ProductRow';

interface ProductTableProps {
  products: SlimProduct[];
  sortNutrientKey: string;
}

const ROW_ESTIMATE = 52;

export function ProductTable({ products, sortNutrientKey }: ProductTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sortLabel = getNutrientLabel(sortNutrientKey);

  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
  });

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_88px_112px_40px] gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
        <div>Product</div>
        <div>Price</div>
        <div className="text-emerald-700">{sortLabel} / 100g</div>
        <div>
          <span className="sr-only">Link</span>
        </div>
      </div>

      <div ref={parentRef} className="max-h-[70vh] overflow-auto">
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const product = products[virtualRow.index];
            return (
              <div
                key={product.id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <ProductRow
                  product={product}
                  sortNutrientKey={sortNutrientKey}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
