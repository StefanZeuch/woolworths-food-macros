import type {
  SlimProduct,
  FilterState,
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

export function sortProducts(
  products: SlimProduct[],
  sort: SortState,
): SlimProduct[] {
  const dir = sort.direction === 'asc' ? 1 : -1;

  return [...products].sort((a, b) => {
    const va = a.nutrients[sort.nutrientKey] ?? null;
    const vb = b.nutrients[sort.nutrientKey] ?? null;

    if (va == null && vb == null) return a.title.localeCompare(b.title);
    if (va == null) return 1;
    if (vb == null) return -1;

    const diff = (va - vb) * dir;
    return diff !== 0 ? diff : a.title.localeCompare(b.title);
  });
}

export function filterAndSortProducts(
  products: SlimProduct[],
  filters: FilterState,
  sort: SortState,
): SlimProduct[] {
  return sortProducts(applyFilters(products, filters), sort);
}
