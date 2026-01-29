import { TarStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { tarStatusConfig } from "@/types/tar";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TARStatusBadgeProps {
  status: TarStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const statusIcons = {
  PENDIENTE: Circle,
  EN_PROGRESO: Clock,
  COMPLETADA: CheckCircle2,
};

/**
 * Badge component to display TAR status
 */
export function TARStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: TARStatusBadgeProps) {
  const config = tarStatusConfig[status];
  const Icon = statusIcons[status];

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
