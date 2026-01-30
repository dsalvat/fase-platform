import { KeyMeeting } from "@prisma/client";
import { KeyMeetingCard } from "./key-meeting-card";

interface KeyMeetingListProps {
  keyMeetings: KeyMeeting[];
  bigRockId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

/**
 * List component to display Key Meetings for a Big Rock
 * Server Component
 */
export function KeyMeetingList({
  keyMeetings,
  bigRockId,
  isReadOnly = false,
  canEdit = true,
}: KeyMeetingListProps) {
  if (keyMeetings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay reuniones clave creadas para este Big Rock.</p>
        {canEdit && !isReadOnly && (
          <p className="text-sm mt-2">
            Crea tu primera reunion clave para planificar las interacciones
            necesarias.
          </p>
        )}
      </div>
    );
  }

  // Sort meetings: upcoming first, then past, completed last
  const sortedMeetings = [...keyMeetings].sort((a, b) => {
    // Completed meetings go to the end
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    // Otherwise sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedMeetings.map((keyMeeting) => (
        <KeyMeetingCard
          key={keyMeeting.id}
          keyMeeting={keyMeeting}
          bigRockId={bigRockId}
          isReadOnly={isReadOnly}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
