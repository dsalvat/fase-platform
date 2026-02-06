import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonthStateBadge } from "./month-state-badge";
import { CalendarNavigation } from "./calendar-navigation";
import type { CalendarView, MonthState } from "@/types/calendar";

interface CalendarHeaderProps {
  title: string;
  view: CalendarView;
  currentValue: string;
  state: MonthState;
  month: string;
  week?: string;
}

export function CalendarHeader({
  title,
  view,
  currentValue,
  state,
  month,
  week,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold capitalize">{title}</h1>
        <MonthStateBadge state={state} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          <Link href={`/calendario?month=${month}`}>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              Mes
            </Button>
          </Link>
          <Link href={week ? `/calendario/semana/${week}` : `/calendario`}>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              Semana
            </Button>
          </Link>
          <Link
            href={`/calendario/dia/${new Date().toISOString().split("T")[0]}`}
          >
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              Día
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <CalendarNavigation view={view} currentValue={currentValue} />
      </div>
    </div>
  );
}
