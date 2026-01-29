import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/big-rocks/category-badge";
import type { DayCalendarData } from "@/types/calendar";

interface DailyViewProps {
  data: DayCalendarData;
}

export function DailyView({ data }: DailyViewProps) {
  const hasItems = data.activities.length > 0 || data.meetings.length > 0;

  return (
    <div className="space-y-4">
      {/* Meetings Section */}
      {data.meetings.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Reuniones Clave ({data.meetings.length})
            </h3>
          </div>
          <div className="divide-y">
            {data.meetings.map((meeting) => (
              <div key={meeting.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {meeting.title}
                      </h4>
                      {meeting.completed && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Completada
                        </span>
                      )}
                    </div>
                    {meeting.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {meeting.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {format(new Date(meeting.date), "HH:mm")}
                      </span>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/big-rocks/${meeting.bigRockId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {meeting.bigRockTitle}
                      </Link>
                      <CategoryBadge
                        category={meeting.bigRockCategory}
                        size="sm"
                      />
                    </div>
                    {meeting.outcome && (
                      <div className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600">
                        <span className="font-medium">Resultado:</span>{" "}
                        {meeting.outcome}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities Section */}
      {data.activities.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Actividades ({data.activities.length})
            </h3>
          </div>
          <div className="divide-y">
            {data.activities.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          activity.completed
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        )}
                      >
                        {activity.completed && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <h4
                        className={cn(
                          "font-medium",
                          activity.completed
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        )}
                      >
                        {activity.title}
                      </h4>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          activity.type === "DIARIA"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        )}
                      >
                        {activity.type === "DIARIA" ? "Diaria" : "Semanal"}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="ml-7 mt-1 text-sm text-gray-500">
                        {activity.description}
                      </p>
                    )}
                    <div className="ml-7 mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        TAR: {activity.tarDescription}
                      </span>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/big-rocks/${activity.bigRockId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {activity.bigRockTitle}
                      </Link>
                      <CategoryBadge
                        category={activity.bigRockCategory}
                        size="sm"
                      />
                    </div>
                    {activity.notes && (
                      <div className="ml-7 mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600">
                        <span className="font-medium">Notas:</span>{" "}
                        {activity.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasItems && (
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
          <p className="text-gray-500">No hay actividades ni reuniones para este día</p>
          <p className="mt-1 text-sm text-gray-400">
            Planifica actividades desde tus Big Rocks y TARs
          </p>
          <Link
            href="/big-rocks"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ir a Big Rocks
          </Link>
        </div>
      )}

      {/* Summary */}
      {hasItems && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-gray-900">Resumen del Día</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Actividades</p>
              <p className="font-medium text-gray-900">
                {data.activities.filter((a) => a.completed).length}/
                {data.activities.length} completadas
              </p>
            </div>
            <div>
              <p className="text-gray-500">Reuniones</p>
              <p className="font-medium text-gray-900">
                {data.meetings.filter((m) => m.completed).length}/
                {data.meetings.length} completadas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
