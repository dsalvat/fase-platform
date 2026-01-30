import { cn } from "@/lib/utils";
import type { ActivitySummary, MeetingSummary } from "@/types/calendar";

interface ActivityItemProps {
  activity: ActivitySummary;
  compact?: boolean;
}

interface MeetingItemProps {
  meeting: MeetingSummary;
  compact?: boolean;
}

export function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          activity.completed ? "bg-green-500" : "bg-blue-400"
        )}
        title={activity.title}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 text-xs",
        activity.completed
          ? "bg-green-50 text-green-700"
          : "bg-gray-50 text-gray-700"
      )}
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          activity.completed ? "bg-green-500" : "bg-blue-400"
        )}
      />
      <span className="truncate">{activity.title}</span>
      {activity.completed && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto shrink-0"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

export function MeetingItem({ meeting, compact = false }: MeetingItemProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-sm",
          meeting.completed ? "bg-green-500" : "bg-amber-400"
        )}
        title={meeting.title}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 text-xs",
        meeting.completed
          ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-700"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span className="truncate">{meeting.title}</span>
      {meeting.completed && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto shrink-0"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
