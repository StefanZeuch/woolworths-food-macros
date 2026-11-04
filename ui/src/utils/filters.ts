import type {
  SlimProduct,
  FilterState,
  SortCriterion,
  SortState,
  DietaryTag,
} from '../types/product';

export const DIETARY_TAGS: DietaryTag[] = [
  'Vegan',
  'Vegetarian',
  'Halaal',
  'Kosher',
];

export function matchesDietary(
  dietaryTags: DietaryTag[],
  selected: DietaryTag[],
): boolean {
  if (selected.length === 0) return true;
  return selected.every((tag) => dietaryTags.includes(tag));
}

export function getPriceBounds(products: SlimProduct[]): {
  min: number;
  max: number;
} {
  if (products.length === 0) return { min: 0, max: 0 };

  const prices = products
    .map((p) => p.price)
    .filter((price): price is number => price != null && Number.isFinite(price));
  if (prices.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.floor(Math.min(...prices) * 100) / 100,
    max: Math.ceil(Math.max(...prices) * 100) / 100,
  };
}

export function countMissingNutrition(products: SlimProduct[]): number {
  return products.filter((p) => !p.hasNutrition).length;
}

export const DEFAULT_FILTERS: FilterState = {
  name: '',
  requireNutrition: true,
  priceMin: null,
  priceMax: null,
  dietary: [],
};

export function applyFilters(
  products: SlimProduct[],
  filters: FilterState,
): SlimProduct[] {
  const nameQuery = filters.name.trim().toLowerCase();

  return products.filter((product) => {
    if (nameQuery && !product.title.toLowerCase().includes(nameQuery)) {
      return false;
    }
    if (filters.requireNutrition && !product.hasNutrition) {
      return false;
    }
    if (filters.priceMin != null) {
      if (product.price == null || product.price < filters.priceMin) {
        return false;
      }
    }
    if (filters.priceMax != null) {
      if (product.price == null || product.price > filters.priceMax) {
        return false;
      }
    }
    if (!matchesDietary(product.dietaryTags, filters.dietary)) {
      return false;
    }
    return true;
  });
}

export const DEFAULT_SORT: SortState = [
  { nutrientKey: 'saturated_fat', direction: 'asc' },
];

export interface RankedProducts {
  products: SlimProduct[];
  scores: Map<string, number | null>;
}

function nutrientValue(product: SlimProduct, key: string): number | null {
  const value = product.nutrients[key];
  return value == null || !Number.isFinite(value) ? null : value;
}

export function rankProducts(
  products: SlimProduct[],
  criteria: SortCriterion[],
): RankedProducts {
  const ranges = criteria.map((criterion) => {
    let min = Infinity;
    let max = -Infinity;

    for (const product of products) {
      const value = nutrientValue(product, criterion.nutrientKey);
      if (value == null) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }

    return { min, max, usable: min !== Infinity && min !== max };
  });

  const scores = new Map<string, number | null>();
  const ranked = products.map((product) => {
    const points: number[] = [];

    for (let index = 0; index < criteria.length; index += 1) {
      const value = nutrientValue(product, criteria[index].nutrientKey);
      if (value == null) {
        scores.set(product.id, null);
        return { product, score: null as number | null };
      }

      const range = ranges[index];
      if (!range.usable) continue;

      const scaled = (value - range.min) / (range.max - range.min);
      points.push(criteria[index].direction === 'asc' ? 1 - scaled : scaled);
    }

    const score =
      points.length === 0
        ? 1
        : points.reduce((total, point) => total + point, 0) / points.length;
    scores.set(product.id, score);
    return { product, score };
  });

  ranked.sort((a, b) => {
    if (a.score == null && b.score == null) {
      return a.product.title.localeCompare(b.product.title);
    }
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    if (a.score !== b.score) return b.score - a.score;
    return a.product.title.localeCompare(b.product.title);
  });

  return {
    products: ranked.map((entry) => entry.product),
    scores,
  };
}

export function filterAndSortProducts(
  products: SlimProduct[],
  filters: FilterState,
  sort: SortState,
): RankedProducts {
  return rankProducts(applyFilters(products, filters), sort);
}
