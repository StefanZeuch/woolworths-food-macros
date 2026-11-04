import { NUTRIENT_OPTIONS } from '../utils/nutrition';
import type { SortCriterion, SortDirection, SortState } from '../types/product';

interface SortControlsProps {
  criteria: SortState;
  onChange: (criteria: SortState) => void;
}

export function SortControls({ criteria, onChange }: SortControlsProps) {
  const selectedKeys = new Set(criteria.map((criterion) => criterion.nutrientKey));
  const nextNutrient = NUTRIENT_OPTIONS.find((option) => !selectedKeys.has(option.key));

  const updateCriterion = (index: number, next: SortCriterion) => {
    onChange(criteria.map((criterion, criterionIndex) => (
      criterionIndex === index ? next : criterion
    )));
  };

  const addCriterion = () => {
    if (!nextNutrient) return;
    onChange([
      ...criteria,
      { nutrientKey: nextNutrient.key, direction: 'asc' },
    ]);
  };

  return (
    <div className="flex flex-col gap-2">
      {criteria.map((criterion, index) => {
        const options = NUTRIENT_OPTIONS.filter(
          (option) => option.key === criterion.nutrientKey || !selectedKeys.has(option.key),
        );

        return (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`sort-nutrient-${index}`}
              className="text-sm font-medium text-gray-700"
            >
              {index === 0 ? 'Sort by' : 'And'}
            </label>
            <select
              id={`sort-nutrient-${index}`}
              value={criterion.nutrientKey}
              onChange={(event) =>
                updateCriterion(index, {
                  ...criterion,
                  nutrientKey: event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {options.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <DirectionToggle
              direction={criterion.direction}
              onChange={(direction) => updateCriterion(index, { ...criterion, direction })}
            />

            {criteria.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(criteria.filter((_, criterionIndex) => criterionIndex !== index))}
                className="rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}

      <div>
        <button
          type="button"
          onClick={addCriterion}
          disabled={!nextNutrient}
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
        >
          Add nutrient
        </button>
      </div>
    </div>
  );
}

function DirectionToggle({
  direction,
  onChange,
}: {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('asc')}
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
        onClick={() => onChange('desc')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          direction === 'desc'
            ? 'bg-emerald-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        High → Low
      </button>
    </div>
  );
}
