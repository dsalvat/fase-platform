import Link from "next/link";
import { BigRockWithCounts } from "@/types/big-rock";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaseCategoryBadge } from "./fase-category-badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, User, MessageSquare, Play } from "lucide-react";

interface BigRockCardProps {
  bigRock: BigRockWithCounts;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

const statusConfig = {
  CREADO: {
    label: "Creado",
    icon: Circle,
    color: "text-gray-500",
  },
  CONFIRMADO: {
    label: "Confirmado",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  FEEDBACK_RECIBIDO: {
    label: "Feedback Recibido",
    icon: MessageSquare,
    color: "text-purple-500",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    icon: Play,
    color: "text-orange-500",
  },
  FINALIZADO: {
    label: "Finalizado",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

/**
 * Card component to display a Big Rock in list views
 * Server Component - renders static content with links
 */
export function BigRockCard({
  bigRock,
  isReadOnly = false,
  canEdit = true,
}: BigRockCardProps) {
  const statusInfo = statusConfig[bigRock.status];
  const StatusIcon = statusInfo.icon;

  // Calculate Big Rock progress based on average TAR progress
  const completedTars = bigRock.tars.filter((tar) => tar.status === "COMPLETADA").length;
  const totalTars = bigRock.tars.length;
  const totalProgress = bigRock.tars.reduce((sum, tar) => sum + tar.progress, 0);
  const bigRockProgress = totalTars > 0 ? Math.round(totalProgress / totalTars) : 0;

  return (
    <Link href={`/big-rocks/${bigRock.id}`} className="block group min-w-0">
      <Card
        className={cn(
          "relative transition-all hover:shadow-md",
          isReadOnly && "opacity-75 bg-muted/50",
          !canEdit && "border-muted"
        )}
      >
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
          <div className="flex items-start gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
              {bigRock.title}
            </CardTitle>
            {bigRock.category && (
              <FaseCategoryBadge category={bigRock.category} size="sm" className="shrink-0 mt-0.5" />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 pt-0 pb-2 sm:pb-3">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
            {bigRock.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            {/* Status indicator */}
            <div className="flex items-center gap-1">
              <StatusIcon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", statusInfo.color)} />
              <span className="hidden sm:inline">{statusInfo.label}</span>
            </div>

            {/* TAR progress */}
            <div className="flex items-center gap-1">
              <span className="font-medium">{completedTars}/{totalTars}</span>
              <span>TARs</span>
            </div>

            {/* Key meetings count */}
            {bigRock._count.keyMeetings > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{bigRock._count.keyMeetings}</span>
                <span className="hidden sm:inline">Reuniones</span>
                <span className="sm:hidden">Reun.</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalTars > 0 && (
            <div className="mt-2 sm:mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progreso</span>
                <span className="font-medium">{bigRockProgress}%</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    bigRockProgress === 100 ? "bg-green-500" : "bg-blue-500"
                  )}
                  style={{ width: `${bigRockProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 sm:p-4 pt-2 sm:pt-3 border-t">
          <div className="flex flex-col gap-1.5 sm:gap-2 w-full text-xs text-muted-foreground">
            {/* Owner info */}
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="font-medium truncate">{bigRock.user.name || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center justify-between w-full gap-2">
              <span className="truncate">
                <span className="hidden sm:inline">Indicador: </span>
                <span className="font-medium">{bigRock.indicator}</span>
              </span>
              {bigRock.aiScore !== null && (
                <span className="shrink-0">
                  <span className="hidden sm:inline">IA Score: </span>
                  <span className={cn(
                    "font-medium",
                    bigRock.aiScore >= 70 ? "text-green-600 dark:text-green-400" : bigRock.aiScore >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                  )}>{bigRock.aiScore}</span>
                </span>
              )}
            </div>
          </div>
        </CardFooter>

        {isReadOnly && (
          <div className="absolute top-2 right-2 bg-gray-700 dark:bg-gray-600 text-white text-xs px-2 py-0.5 rounded">
            Solo lectura
          </div>
        )}
      </Card>
    </Link>
  );
}
