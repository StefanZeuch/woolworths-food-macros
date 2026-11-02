interface NutrientBadgeProps {
  label: string;
  value: string;
  unit: string;
  highlighted?: boolean;
}

export function NutrientBadge({
  label,
  value,
  unit,
  highlighted = false,
}: NutrientBadgeProps) {
  return (
    <div
      className={`rounded-md border px-2 py-1.5 text-xs ${
        highlighted
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : 'border-gray-200 bg-gray-50 text-gray-700'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-1 tabular-nums">
        {value} {unit}
      </span>
    </div>
  );
}
