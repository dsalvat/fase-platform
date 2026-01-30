import { cn } from "@/lib/utils";
import { DayCell } from "./day-cell";
import { OpenMonthButton } from "./open-month-button";
import type { MonthCalendarData } from "@/types/calendar";

interface MonthlyViewProps {
  data: MonthCalendarData;
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthlyView({ data }: MonthlyViewProps) {
  const isLocked = data.state === "future-locked";

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className={cn("relative rounded-lg border bg-white shadow-sm", isLocked && "overflow-hidden")}>
        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
            <div className="text-center">
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
                className="mx-auto mb-3 text-yellow-500"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="mb-4 text-gray-600">
                Este mes está bloqueado para planificación
              </p>
              <OpenMonthButton month={data.month} />
            </div>
          </div>
        )}

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r py-2 text-center text-sm font-medium text-gray-600 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {data.days.map((day) => (
            <DayCell key={day.date} day={day} showDetails />
          ))}
        </div>
      </div>

      {/* Big Rocks Summary */}
      {data.bigRocks.length > 0 && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Big Rocks del Mes</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.bigRocks.map((bigRock) => (
              <div
                key={bigRock.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {bigRock.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {bigRock.completedTars}/{bigRock.numTars} TARs
                  </p>
                </div>
                <div
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
                    bigRock.status === "FINALIZADO"
                      ? "bg-green-100 text-green-700"
                      : bigRock.status === "EN_PROGRESO"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {bigRock.status === "FINALIZADO"
                    ? "Completado"
                    : bigRock.status === "EN_PROGRESO"
                    ? "En Progreso"
                    : "Planificado"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
