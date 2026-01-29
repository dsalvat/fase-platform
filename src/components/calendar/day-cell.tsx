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
        "group flex min-h-[100px] flex-col border-b border-r p-1 transition-colors hover:bg-gray-50",
        !day.isCurrentMonth && "bg-gray-50/50 text-gray-400",
        day.isToday && "bg-blue-50"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm",
          day.isToday && "bg-blue-600 font-bold text-white",
          !day.isToday && day.isCurrentMonth && "font-medium text-gray-900",
          !day.isToday && !day.isCurrentMonth && "text-gray-400"
        )}
      >
        {day.dayOfMonth}
      </div>

      {hasItems && (
        <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
          {showDetails ? (
            <>
              {day.activities.slice(0, maxItemsToShow).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              {day.meetings.slice(0, Math.max(0, maxItemsToShow - day.activities.length)).map((meeting) => (
                <MeetingItem key={meeting.id} meeting={meeting} />
              ))}
              {totalItems > maxItemsToShow && (
                <div className="mt-auto text-xs text-gray-500">
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
                <span className="text-[10px] text-gray-400">+{totalItems - 4}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
