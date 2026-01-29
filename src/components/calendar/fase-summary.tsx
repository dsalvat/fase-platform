import { cn } from "@/lib/utils";
import type { FaseSummaryData } from "@/types/calendar";

interface FaseSummaryProps {
  data: FaseSummaryData;
  className?: string;
}

const categoryConfig = {
  focus: {
    label: "Focus",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    progressColor: "bg-blue-500",
  },
  atencion: {
    label: "Atención",
    color: "bg-green-100 text-green-800 border-green-200",
    progressColor: "bg-green-500",
  },
  sistemas: {
    label: "Sistemas",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    progressColor: "bg-purple-500",
  },
  energia: {
    label: "Energía",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    progressColor: "bg-orange-500",
  },
};

export function FaseSummary({ data, className }: FaseSummaryProps) {
  const categories = Object.entries(data) as [
    keyof FaseSummaryData,
    { total: number; completed: number }
  ][];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {categories.map(([key, value]) => {
        const config = categoryConfig[key];
        const percentage =
          value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0;

        return (
          <div
            key={key}
            className={cn(
              "rounded-lg border p-3",
              config.color
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{config.label}</span>
              <span className="text-xs">
                {value.completed}/{value.total}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/50">
              <div
                className={cn("h-1.5 rounded-full", config.progressColor)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
