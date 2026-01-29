"use client";

import { Activity } from "@prisma/client";
import { ActivityTypeBadge } from "./activity-type-badge";
import { ActivityCompletionToggle } from "./activity-completion-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityCardProps {
  activity: Activity;
  isReadOnly?: boolean;
  canEdit?: boolean;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

/**
 * Card component to display an Activity in list views
 */
export function ActivityCard({
  activity,
  isReadOnly = false,
  canEdit = true,
}: ActivityCardProps) {
  return (
    <Card
      className={cn(
        "transition-all",
        activity.completed && "bg-green-50 border-green-200",
        isReadOnly && "opacity-75"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ActivityTypeBadge type={activity.type} size="sm" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(activity.date), "EEEE, d MMM", { locale: es })}
              </span>
            </div>

            <p
              className={cn(
                "text-sm font-medium",
                activity.completed && "line-through text-muted-foreground"
              )}
            >
              {activity.title}
            </p>

            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}

            {activity.notes && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <span className="font-medium">Notas: </span>
                {activity.notes}
              </div>
            )}
          </div>

          {/* Completion toggle */}
          {canEdit && !isReadOnly && (
            <ActivityCompletionToggle
              activityId={activity.id}
              initialCompleted={activity.completed}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
