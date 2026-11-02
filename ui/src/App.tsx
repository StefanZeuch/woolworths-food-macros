import { startTransition, useMemo, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { SortControls } from './components/SortControls';
import { FilterPanel } from './components/FilterPanel';
import { ProductTable } from './components/ProductTable';
import { useProducts } from './hooks/useProducts';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import type { FilterState, SortState } from './types/product';
import {
  filterAndSortProducts,
  getPriceBounds,
  countMissingNutrition,
  DEFAULT_FILTERS,
} from './utils/filters';

function App() {
  const { data, loading, error } = useProducts();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({
    nutrientKey: 'saturated_fat',
    direction: 'asc',
  });

  const debouncedName = useDebouncedValue(filters.name);

  const products = data?.products ?? [];
  const priceBounds = useMemo(() => getPriceBounds(products), [products]);
  const missingNutrition = useMemo(
    () => countMissingNutrition(products),
    [products],
  );

  const effectiveFilters = useMemo(
    () => ({ ...filters, name: debouncedName }),
    [filters, debouncedName],
  );

  const sortedProducts = useMemo(
    () => filterAndSortProducts(products, effectiveFilters, sort),
    [products, effectiveFilters, sort],
  );

  const updateFilters = (next: FilterState) => {
    startTransition(() => {
      setFilters(next);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setFilters(DEFAULT_FILTERS);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Woolworths Food Explorer
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {products.length} products
            {data?.scrapedAt && (
              <>
                {' '}
                · scraped{' '}
                {new Date(data.scrapedAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </>
            )}
            {missingNutrition > 0 && (
              <> · {missingNutrition} missing nutrition</>
            )}
            {' '}
            · showing {sortedProducts.length}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="sticky top-0 z-10 space-y-4 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar
              value={filters.name}
              onChange={(name) => updateFilters({ ...filters, name })}
            />
            <SortControls
              nutrientKey={sort.nutrientKey}
              direction={sort.direction}
              onNutrientChange={(nutrientKey) =>
                setSort((prev) => ({ ...prev, nutrientKey }))
              }
              onDirectionChange={(direction) =>
                setSort((prev) => ({ ...prev, direction }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <FilterPanel
            filters={filters}
            priceBounds={priceBounds}
            onChange={updateFilters}
            onClear={clearFilters}
          />
          <ProductTable
            products={sortedProducts}
            sortNutrientKey={sort.nutrientKey}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
