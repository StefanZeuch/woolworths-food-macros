import type { FilterState, DietaryTag } from '../types/product';
import { DIETARY_TAGS } from '../utils/filters';

interface FilterPanelProps {
  filters: FilterState;
  priceBounds: { min: number; max: number };
  onChange: (filters: FilterState) => void;
  onClear: () => void;
}

export function FilterPanel({
  filters,
  priceBounds,
  onChange,
  onClear,
}: FilterPanelProps) {
  const toggleDietary = (tag: DietaryTag) => {
    const next = filters.dietary.includes(tag)
      ? filters.dietary.filter((t) => t !== tag)
      : [...filters.dietary, tag];
    onChange({ ...filters, dietary: next });
  };

  const hasActiveFilters =
    filters.requireNutrition === false ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.dietary.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-emerald-700 hover:text-emerald-800"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.requireNutrition}
            onChange={(e) =>
              onChange({ ...filters, requireNutrition: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">Only products with nutrition data</span>
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Price range (ZAR)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={priceBounds.min}
              max={priceBounds.max}
              step="0.01"
              placeholder={`Min (${priceBounds.min})`}
              value={filters.priceMin ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  priceMin: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min={priceBounds.min}
              max={priceBounds.max}
              step="0.01"
              placeholder={`Max (${priceBounds.max})`}
              value={filters.priceMax ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  priceMax: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Dietary</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const active = filters.dietary.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietary(tag)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
