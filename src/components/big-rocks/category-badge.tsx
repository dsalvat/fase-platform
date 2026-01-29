import { FaseCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: FaseCategory;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const categoryConfig = {
  FOCUS: {
    label: "Focus",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ATENCION: {
    label: "Atención",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  SISTEMAS: {
    label: "Sistemas",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  ENERGIA: {
    label: "Energía",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

/**
 * Badge component to display FASE category with color coding
 * Server Component - no interactivity needed
 */
export function CategoryBadge({
  category,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const config = categoryConfig[category];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}
