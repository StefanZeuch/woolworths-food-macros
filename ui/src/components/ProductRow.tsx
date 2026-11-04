import { memo, useState } from 'react';
import type { SlimProduct, SortState } from '../types/product';
import {
  describeSortCriteria,
  getAllNutrientsFromDetail,
  getNutrient,
  getNutrientLabel,
} from '../utils/nutrition';
import { formatPrice } from '../utils/format';
import { useProductDetail } from '../hooks/useProductDetail';
import { NutrientBadge } from './NutrientBadge';

interface ProductRowProps {
  product: SlimProduct;
  criteria: SortState;
  score: number | null;
}

export const ProductRow = memo(function ProductRow({
  product,
  criteria,
  score,
}: ProductRowProps) {
  const [expanded, setExpanded] = useState(false);
  const blended = criteria.length > 1;
  const primaryKey = criteria[0]?.nutrientKey ?? '';
  const sortNutrient = getNutrient(product, primaryKey);
  const selectedKeys = new Set(criteria.map((criterion) => criterion.nutrientKey));
  const { detail, loading, error } = useProductDetail(
    product.id,
    product.chunk,
    expanded,
  );

  const allNutrients = detail ? getAllNutrientsFromDetail(detail) : [];

  return (
    <div className="border-b border-gray-100">
      <div
        className="grid cursor-pointer grid-cols-[minmax(0,1fr)_88px_112px_40px] items-center gap-2 px-4 py-3 hover:bg-gray-50"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-block shrink-0 text-gray-400 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="truncate font-medium text-gray-900">{product.title}</span>
        </div>
        <div className="tabular-nums text-gray-700">{formatPrice(product.price)}</div>
        <div className="tabular-nums">
          {blended ? (
            score == null ? (
              <span className="text-gray-400">—</span>
            ) : (
              <span className="font-medium text-emerald-700">
                {Math.round(score * 100)}%
              </span>
            )
          ) : sortNutrient ? (
            <span className="font-medium text-emerald-700">
              {sortNutrient.display} {sortNutrient.unit}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
        <div>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-emerald-700 hover:text-emerald-800"
            aria-label={`View ${product.title} on Woolworths`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 pl-10">
          {loading && (
            <p className="text-sm text-gray-500">Loading details…</p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {product.brand && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Brand:</span> {product.brand}
                </p>
              )}

              {product.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.dietaryTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {detail?.ingredients && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ingredients:</span>{' '}
                  {detail.ingredients}
                </p>
              )}

              {!detail?.ingredients && product.ingredientsPreview && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ingredients:</span>{' '}
                  {product.ingredientsPreview}
                  {product.ingredientsPreview.length >= 200 ? '…' : ''}
                </p>
              )}

              {allNutrients.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Nutrition per 100g
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allNutrients.map((nutrient) => (
                      <NutrientBadge
                        key={nutrient.key}
                        label={nutrient.label}
                        value={nutrient.display}
                        unit={nutrient.unit}
                        highlighted={selectedKeys.has(nutrient.key)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                !product.hasNutrition && (
                  <p className="text-sm text-amber-700">
                    This product has no nutrition information in the dataset.
                  </p>
                )
              )}

              {product.hasNutrition && criteria.length > 0 && (
                <p className="text-xs text-gray-500">
                  {blended
                    ? `Sorted by ${describeSortCriteria(criteria)} (per 100g)`
                    : `Sorted by ${getNutrientLabel(primaryKey)} (per 100g)`}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
