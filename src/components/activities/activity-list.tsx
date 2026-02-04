import { Activity } from "@prisma/client";
import { ActivityCard } from "./activity-card";

interface ActivityListProps {
  activities: Activity[];
  bigRockId: string;
  tarId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

/**
 * List component to display Activities for a TAR
 * Server Component
 */
export function ActivityList({
  activities,
  bigRockId,
  tarId,
  isReadOnly = false,
  canEdit = true,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay actividades creadas para esta TAR.</p>
        {canEdit && !isReadOnly && (
          <p className="text-sm mt-2">
            Crea actividades semanales o diarias para avanzar en esta tarea.
          </p>
        )}
      </div>
    );
  }

  // Group activities by week
  const groupedByWeek = activities.reduce((acc, activity) => {
    const week = activity.week || "Sin semana";
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const weeks = Object.keys(groupedByWeek).sort();

  return (
    <div className="space-y-6">
      {weeks.map((week) => (
        <div key={week}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Semana {week}
          </h4>
          <div className="space-y-2">
            {groupedByWeek[week].map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                bigRockId={bigRockId}
                tarId={tarId}
                isReadOnly={isReadOnly}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
