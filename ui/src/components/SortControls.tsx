import { NUTRIENT_OPTIONS } from '../utils/nutrition';
import type { SortDirection } from '../types/product';

interface SortControlsProps {
  nutrientKey: string;
  direction: SortDirection;
  onNutrientChange: (key: string) => void;
  onDirectionChange: (direction: SortDirection) => void;
}

export function SortControls({
  nutrientKey,
  direction,
  onNutrientChange,
  onDirectionChange,
}: SortControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="sort-nutrient" className="text-sm font-medium text-gray-700">
        Sort by
      </label>
      <select
        id="sort-nutrient"
        value={nutrientKey}
        onChange={(e) => onNutrientChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {NUTRIENT_OPTIONS.map(({ key, label }) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onDirectionChange('asc')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            direction === 'asc'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Low → High
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange('desc')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            direction === 'desc'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          High → Low
        </button>
      </div>
    </div>
  );
}
