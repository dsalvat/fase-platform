import { cn } from "@/lib/utils";
import type { MonthState } from "@/types/calendar";

interface MonthStateBadgeProps {
  state: MonthState;
  className?: string;
}

const stateConfig = {
  past: {
    label: "Solo lectura",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  current: {
    label: "Mes actual",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  "future-open": {
    label: "Planificación",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "future-locked": {
    label: "Bloqueado",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
};

export function MonthStateBadge({ state, className }: MonthStateBadgeProps) {
  const config = stateConfig[state];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
