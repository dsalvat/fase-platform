import { FaseCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

const categoryConfig: Record<FaseCategory, {
  label: string;
  letter: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  FOCUS: {
    label: "Focus",
    letter: "F",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  ATENCION: {
    label: "Atención",
    letter: "A",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  SISTEMAS: {
    label: "Sistemas",
    letter: "S",
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  ENERGIA: {
    label: "Energía",
    letter: "E",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

interface FaseCategoryBadgeProps {
  category: FaseCategory;
  size?: "sm" | "md";
  className?: string;
}

export function FaseCategoryBadge({
  category,
  size = "md",
  className,
}: FaseCategoryBadgeProps) {
  const config = categoryConfig[category];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-sm",
        className
      )}
    >
      <span className={cn("rounded-full shrink-0", config.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {size === "sm" ? config.letter : config.label}
    </span>
  );
}

export { categoryConfig };
