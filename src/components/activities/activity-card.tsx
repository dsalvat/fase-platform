"use client";

import Link from "next/link";
import { Activity } from "@prisma/client";
import { ActivityTypeBadge } from "./activity-type-badge";
import { ActivityCompletionToggle } from "./activity-completion-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil } from "lucide-react";

interface ActivityCardProps {
  activity: Activity;
  bigRockId: string;
  tarId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

/**
 * Card component to display an Activity in list views
 */
export function ActivityCard({
  activity,
  bigRockId,
  tarId,
  isReadOnly = false,
  canEdit = true,
}: ActivityCardProps) {
  // Activity is editable only if its date is today or in the future
  const activityDate = startOfDay(new Date(activity.date));
  const today = startOfDay(new Date());
  const isPastActivity = isBefore(activityDate, today);
  const isActivityEditable = canEdit && !isReadOnly && !isPastActivity;
  return (
    <Card
      className={cn(
        "transition-all",
        activity.completed && "bg-green-50 border-green-200",
        (isReadOnly || isPastActivity) && "opacity-75"
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

          {/* Actions - only for today or future activities */}
          {isActivityEditable && (
            <div className="flex items-center gap-1">
              <Link href={`/big-rocks/${bigRockId}/tars/${tarId}/activities/${activity.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <ActivityCompletionToggle
                activityId={activity.id}
                initialCompleted={activity.completed}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
