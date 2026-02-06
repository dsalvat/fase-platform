import { cn } from "@/lib/utils";
import { DayCell } from "./day-cell";
import { OpenMonthButton } from "./open-month-button";
import type { MonthCalendarData } from "@/types/calendar";

interface MonthlyViewProps {
  data: MonthCalendarData;
}

// Full names for tablet/desktop, single letters for mobile
const weekDaysFull = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const weekDaysMobile = ["L", "M", "X", "J", "V", "S", "D"];

export function MonthlyView({ data }: MonthlyViewProps) {
  const isLocked = data.state === "future-locked";

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className={cn("relative rounded-lg border bg-card shadow-sm", isLocked && "overflow-hidden")}>
        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
            <div className="text-center px-4">
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
              <p className="mb-4 text-muted-foreground">
                Este mes está bloqueado para planificación
              </p>
              <OpenMonthButton month={data.month} />
            </div>
          </div>
        )}

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {weekDaysFull.map((day, index) => (
            <div
              key={day}
              className="border-r py-1.5 sm:py-2 text-center text-xs sm:text-sm font-medium text-muted-foreground last:border-r-0"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysMobile[index]}</span>
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
        <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-foreground">Big Rocks del Mes</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.bigRocks.map((bigRock) => (
              <div
                key={bigRock.id}
                className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground text-sm sm:text-base">
                    {bigRock.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {bigRock.completedTars}/{bigRock.numTars} TARs
                  </p>
                </div>
                <div
                  className={cn(
                    "ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    bigRock.status === "FINALIZADO"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : bigRock.status === "EN_PROGRESO"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">
                    {bigRock.status === "FINALIZADO"
                      ? "Completado"
                      : bigRock.status === "EN_PROGRESO"
                      ? "En Progreso"
                      : "Planificado"}
                  </span>
                  <span className="sm:hidden">
                    {bigRock.status === "FINALIZADO"
                      ? "OK"
                      : bigRock.status === "EN_PROGRESO"
                      ? "Prog"
                      : "Plan"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
