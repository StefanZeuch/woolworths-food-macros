import type {
  ProductDetail,
  ParsedNutrient,
  SlimProduct,
  SortCriterion,
} from '../types/product';

export interface NutrientOption {
  key: string;
  label: string;
}

export const NUTRIENT_OPTIONS: NutrientOption[] = [
  { key: 'energy', label: 'Energy' },
  { key: 'protein', label: 'Protein' },
  { key: 'carbohydrate', label: 'Carbohydrate' },
  { key: 'total_fat', label: 'Total fat' },
  { key: 'saturated_fat', label: 'Saturated fat' },
  { key: 'trans_fat', label: 'Trans fat' },
  { key: 'monounsaturated_fat', label: 'Monounsaturated fat' },
  { key: 'polyunsaturated_fat', label: 'Polyunsaturated fat' },
  { key: 'total_sugar', label: 'Total sugar' },
  { key: 'dietary_fibre_', label: 'Dietary fibre' },
  { key: 'sodium', label: 'Sodium' },
  { key: 'cholesterol', label: 'Cholesterol' },
  { key: 'calcium', label: 'Calcium' },
  { key: 'iron', label: 'Iron' },
  { key: 'potassium', label: 'Potassium' },
  { key: 'vitamin_a', label: 'Vitamin A' },
  { key: 'folic_acid', label: 'Folic acid' },
  { key: 'niacin', label: 'Niacin' },
  { key: 'riboflavin', label: 'Riboflavin' },
  { key: 'thiamin', label: 'Thiamin' },
  { key: 'pyridoxine_vitamin_b6_', label: 'Vitamin B6' },
  { key: 'zinc', label: 'Zinc' },
];

const NUTRIENT_LABELS = Object.fromEntries(
  NUTRIENT_OPTIONS.map(({ key, label }) => [key, label]),
);

const NUTRIENT_UNITS: Record<string, string> = {
  energy: 'kJ',
  sodium: 'mg',
  cholesterol: 'mg',
  calcium: 'mg',
  iron: 'mg',
  potassium: 'mg',
  vitamin_a: 'µg',
  folic_acid: 'µg',
  zinc: 'mg',
};

export function formatNutrientDisplay(raw: string | null | undefined): string {
  if (raw == null) return '—';
  const trimmed = raw.trim();
  return trimmed || '—';
}

export function getNutrientUnit(key: string): string {
  return NUTRIENT_UNITS[key] ?? 'g';
}

export function getNutrient(
  product: SlimProduct,
  key: string,
): ParsedNutrient | null {
  const numeric = product.nutrients[key];
  if (numeric == null) return null;

  return {
    display: String(numeric),
    numeric,
    unit: getNutrientUnit(key),
  };
}

export function getNutrientLabel(key: string): string {
  return NUTRIENT_LABELS[key] ?? key.replace(/_/g, ' ');
}

export function describeSortCriteria(criteria: SortCriterion[]): string {
  return criteria
    .map((criterion) => {
      const direction = criterion.direction === 'asc' ? 'low' : 'high';
      const label = getNutrientLabel(criterion.nutrientKey);
      return `${direction} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
    })
    .join(', ');
}

export function getAllNutrientsFromDetail(detail: ProductDetail): Array<{
  key: string;
  label: string;
  display: string;
  unit: string;
}> {
  if (!detail.nutrition?.per100g) return [];

  return Object.entries(detail.nutrition.per100g)
    .map(([key, entry]) => ({
      key,
      label: getNutrientLabel(key),
      display: formatNutrientDisplay(entry.value),
      unit: entry.unit,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
