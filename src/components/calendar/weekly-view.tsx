import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ActivityItem, MeetingItem } from "./activity-item";
import type { WeekCalendarData, DayData } from "@/types/calendar";

interface WeeklyViewProps {
  data: WeekCalendarData;
}

function WeekDayColumn({ day }: { day: DayData }) {
  const hasItems = day.activities.length > 0 || day.meetings.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col border-r last:border-r-0",
        day.isToday && "bg-blue-50/50"
      )}
    >
      {/* Day Header */}
      <Link
        href={`/calendario/dia/${day.date}`}
        className="flex flex-col items-center border-b py-2 hover:bg-gray-50"
      >
        <span className="text-xs text-gray-500">
          {format(new Date(day.date), "EEE", { locale: es })}
        </span>
        <span
          className={cn(
            "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
            day.isToday && "bg-blue-600 text-white",
            !day.isToday && "text-gray-900"
          )}
        >
          {day.dayOfMonth}
        </span>
      </Link>

      {/* Day Content */}
      <div className="flex-1 space-y-1 p-2">
        {day.meetings.map((meeting) => (
          <MeetingItem key={meeting.id} meeting={meeting} />
        ))}
        {day.activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
        {!hasItems && (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-gray-400">Sin actividades</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WeeklyView({ data }: WeeklyViewProps) {
  return (
    <div className="space-y-4">
      {/* Week Grid */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="grid min-h-[400px] grid-cols-7">
          {data.days.map((day) => (
            <WeekDayColumn key={day.date} day={day} />
          ))}
        </div>
      </div>

      {/* TARs for this week */}
      {data.tars.length > 0 && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">TARs de la Semana</h3>
          <div className="space-y-3">
            {data.tars.map((tar) => (
              <div
                key={tar.id}
                className="rounded-lg border border-l-4 border-l-blue-400 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{tar.description}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Big Rock: {tar.bigRockTitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        tar.status === "COMPLETADA"
                          ? "bg-green-100 text-green-700"
                          : tar.status === "EN_PROGRESO"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {tar.progress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        tar.status === "COMPLETADA"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      )}
                      style={{ width: `${tar.progress}%` }}
                    />
                  </div>
                </div>

                {/* Activities count */}
                <p className="mt-2 text-xs text-gray-500">
                  {tar.activities.filter((a) => a.completed).length}/
                  {tar.activities.length} actividades completadas esta semana
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tars.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-gray-400"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <p className="text-gray-500">No hay TARs con actividades esta semana</p>
          <p className="mt-1 text-sm text-gray-400">
            Planifica actividades desde tus Big Rocks
          </p>
        </div>
      )}
    </div>
  );
}
