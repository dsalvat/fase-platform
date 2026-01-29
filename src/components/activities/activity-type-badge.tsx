import { ActivityType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { activityTypeConfig } from "@/types/activity";
import { Calendar, CalendarDays } from "lucide-react";

interface ActivityTypeBadgeProps {
  type: ActivityType;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const typeIcons = {
  SEMANAL: CalendarDays,
  DIARIA: Calendar,
};

/**
 * Badge component to display Activity type
 */
export function ActivityTypeBadge({
  type,
  size = "md",
  showIcon = true,
}: ActivityTypeBadgeProps) {
  const config = activityTypeConfig[type];
  const Icon = typeIcons[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        "border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {showIcon && (
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      )}
      {config.label}
    </span>
  );
}
