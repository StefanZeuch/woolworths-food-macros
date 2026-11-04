export interface NutrientValue {
  value: string;
  unit: string;
}

export interface NutritionRow {
  label: string;
  per100g: string;
  perServing: string;
  unit: string;
  rdiPercent: string;
}

export interface Nutrition {
  rows: NutritionRow[];
  per100g: Record<string, NutrientValue>;
}

export interface ProductDetail {
  description: string | null;
  descriptionHtml: string | null;
  ingredients: string | null;
  allergens: string | null;
  dietary: string | null;
  nutrition: Nutrition | null;
}

export interface SlimProduct {
  id: string;
  url: string;
  title: string;
  price: number | null;
  brand: string | null;
  dietaryTags: DietaryTag[];
  ingredientsPreview: string | null;
  chunk: number;
  hasNutrition: boolean;
  nutrients: Record<string, number | null>;
}

export interface ProductsFile {
  scrapedAt: string;
  inputFile: string;
  totalProducts: number;
  failed: number;
  chunkSize: number;
  chunkCount: number;
  products: SlimProduct[];
}

export type DietaryTag = 'Vegan' | 'Vegetarian' | 'Halaal' | 'Kosher';

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  name: string;
  requireNutrition: boolean;
  priceMin: number | null;
  priceMax: number | null;
  dietary: DietaryTag[];
}

export interface SortCriterion {
  nutrientKey: string;
  direction: SortDirection;
}

export type SortState = SortCriterion[];

export interface ParsedNutrient {
  display: string;
  numeric: number | null;
  unit: string;
}
