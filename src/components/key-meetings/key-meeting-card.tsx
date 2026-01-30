import Link from "next/link";
import { KeyMeeting } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

interface KeyMeetingCardProps {
  keyMeeting: KeyMeeting;
  bigRockId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

/**
 * Card component to display a Key Meeting in list views
 * Server Component - renders static content with links
 */
export function KeyMeetingCard({
  keyMeeting,
  bigRockId,
  isReadOnly = false,
  canEdit = true,
}: KeyMeetingCardProps) {
  const meetingDate = new Date(keyMeeting.date);
  const isPast = meetingDate < new Date();
  const isUpcoming =
    !isPast &&
    meetingDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link
      href={`/big-rocks/${bigRockId}/meetings/${keyMeeting.id}`}
      className="block group"
    >
      <Card
        className={cn(
          "transition-all hover:shadow-md hover:border-blue-300",
          isReadOnly && "opacity-75 bg-gray-50",
          !canEdit && "border-gray-300",
          keyMeeting.completed && "border-green-200 bg-green-50/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {keyMeeting.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : isPast ? (
                  <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                ) : (
                  <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {keyMeeting.title}
                </p>
              </div>

              {keyMeeting.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {keyMeeting.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    keyMeeting.completed
                      ? "bg-green-100 text-green-700"
                      : isPast
                      ? "bg-orange-100 text-orange-700"
                      : isUpcoming
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {keyMeeting.completed
                    ? "Completada"
                    : isPast
                    ? "Pendiente"
                    : isUpcoming
                    ? "Proxima"
                    : "Programada"}
                </span>

                {keyMeeting.outcome && (
                  <span className="text-xs text-muted-foreground">
                    Con resultado
                  </span>
                )}
              </div>
            </div>

            {/* Date indicator */}
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-medium text-gray-600">
                {formatDate(meetingDate)}
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
