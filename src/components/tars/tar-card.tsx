import Link from "next/link";
import { TAR } from "@prisma/client";
import { TARStatusBadge } from "./tar-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TARCardProps {
  tar: TAR & {
    _count?: {
      activities: number;
    };
  };
  bigRockId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

/**
 * Card component to display a TAR in list views
 * Server Component - renders static content with links
 */
export function TARCard({
  tar,
  bigRockId,
  isReadOnly = false,
  canEdit = true,
}: TARCardProps) {
  return (
    <Link
      href={`/big-rocks/${bigRockId}/tars/${tar.id}`}
      className="block group"
    >
      <Card
        className={cn(
          "transition-all hover:shadow-md hover:border-blue-300",
          isReadOnly && "opacity-75 bg-gray-50",
          !canEdit && "border-gray-300"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {tar.description}
              </p>

              <div className="flex items-center gap-3 mt-2">
                <TARStatusBadge status={tar.status} size="sm" />

                {tar._count && tar._count.activities > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {tar._count.activities} actividad
                    {tar._count.activities !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-semibold text-gray-900">
                {tar.progress}%
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                  className={cn(
                    "h-full transition-all",
                    tar.progress === 100
                      ? "bg-green-500"
                      : tar.progress > 0
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  )}
                  style={{ width: `${tar.progress}%` }}
                />
              </div>
            </div>
          </div>

          {isReadOnly && (
            <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
              Solo lectura
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
