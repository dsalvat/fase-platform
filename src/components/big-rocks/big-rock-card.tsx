import Link from "next/link";
import { BigRockWithCounts } from "@/types/big-rock";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Link href={`/big-rocks/${bigRock.id}`} className="block group">
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          isReadOnly && "opacity-75 bg-gray-50",
          !canEdit && "border-gray-300"
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
            {bigRock.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {bigRock.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
              <span>{statusInfo.label}</span>
            </div>

            {/* TAR progress */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{completedTars}/{totalTars}</span>
              <span>TARs</span>
            </div>

            {/* Key meetings count */}
            {bigRock._count.keyMeetings > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{bigRock._count.keyMeetings}</span>
                <span>Reuniones</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalTars > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progreso</span>
                <span className="font-medium">{bigRockProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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

        <CardFooter className="pt-3 border-t">
          <div className="flex flex-col gap-2 w-full text-xs text-muted-foreground">
            {/* Owner info */}
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">{bigRock.user.name || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center justify-between w-full">
              <span>
                Indicador: <span className="font-medium">{bigRock.indicator}</span>
              </span>
              {bigRock.aiScore !== null && (
                <span>
                  IA Score: <span className={cn(
                    "font-medium",
                    bigRock.aiScore >= 70 ? "text-green-600" : bigRock.aiScore >= 40 ? "text-yellow-600" : "text-red-600"
                  )}>{bigRock.aiScore}/100</span>
                </span>
              )}
            </div>
          </div>
        </CardFooter>

        {isReadOnly && (
          <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
            Solo lectura
          </div>
        )}
      </Card>
    </Link>
  );
}
