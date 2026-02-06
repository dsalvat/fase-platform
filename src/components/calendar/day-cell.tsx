import Link from "next/link";
import { cn } from "@/lib/utils";
import { ActivityItem, MeetingItem } from "./activity-item";
import type { DayData } from "@/types/calendar";

interface DayCellProps {
  day: DayData;
  showDetails?: boolean;
}

export function DayCell({ day, showDetails = false }: DayCellProps) {
  const hasItems = day.activities.length > 0 || day.meetings.length > 0;
  const totalItems = day.activities.length + day.meetings.length;
  const maxItemsToShow = showDetails ? 3 : 0;

  return (
    <Link
      href={`/calendario/dia/${day.date}`}
      className={cn(
        "group flex min-h-[60px] sm:min-h-[100px] flex-col border-b border-r p-0.5 sm:p-1 transition-colors hover:bg-muted/50",
        !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
        day.isToday && "bg-blue-50 dark:bg-blue-950/30"
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm",
          day.isToday && "bg-blue-600 font-bold text-white",
          !day.isToday && day.isCurrentMonth && "font-medium text-foreground",
          !day.isToday && !day.isCurrentMonth && "text-muted-foreground"
        )}
      >
        {day.dayOfMonth}
      </div>

      {hasItems && (
        <div className="mt-0.5 sm:mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
          {/* Mobile: Show dots only */}
          <div className="sm:hidden flex flex-wrap gap-0.5 justify-center">
            {day.activities.slice(0, 3).map((activity) => (
              <span
                key={activity.id}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  activity.completed
                    ? "bg-green-500"
                    : "bg-blue-500"
                )}
              />
            ))}
            {day.meetings.slice(0, Math.max(0, 3 - day.activities.length)).map((meeting) => (
              <span
                key={meeting.id}
                className="h-1.5 w-1.5 rounded-full bg-purple-500"
              />
            ))}
            {totalItems > 3 && (
              <span className="text-[8px] text-muted-foreground">+{totalItems - 3}</span>
            )}
          </div>

          {/* Desktop: Show full details */}
          <div className="hidden sm:flex flex-1 flex-col gap-0.5 overflow-hidden">
            {showDetails ? (
              <>
                {day.activities.slice(0, maxItemsToShow).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
                {day.meetings.slice(0, Math.max(0, maxItemsToShow - day.activities.length)).map((meeting) => (
                  <MeetingItem key={meeting.id} meeting={meeting} />
                ))}
                {totalItems > maxItemsToShow && (
                  <div className="mt-auto text-xs text-muted-foreground">
                    +{totalItems - maxItemsToShow} más
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-0.5">
                {day.activities.slice(0, 4).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} compact />
                ))}
                {day.meetings.slice(0, Math.max(0, 4 - day.activities.length)).map((meeting) => (
                  <MeetingItem key={meeting.id} meeting={meeting} compact />
                ))}
                {totalItems > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{totalItems - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
