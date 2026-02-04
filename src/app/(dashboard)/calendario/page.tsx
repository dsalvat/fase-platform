import { Suspense } from "react";
import { getMonthCalendarData } from "@/app/actions/calendar";
import { formatMonthLabel, getCurrentMonth, getCurrentWeek } from "@/lib/month-helpers";
import { CalendarHeader, MonthlyView } from "@/components/calendar";

interface CalendarioPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function CalendarContent({ month }: { month: string }) {
  const data = await getMonthCalendarData(month);

  return (
    <div className="space-y-6">
      <CalendarHeader
        title={formatMonthLabel(data.month)}
        view="month"
        currentValue={data.month}
        state={data.state}
        month={data.month}
        week={getCurrentWeek()}
      />
      <MonthlyView data={data} />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-[500px] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default async function CalendarioPage({ searchParams }: CalendarioPageProps) {
  const params = await searchParams;
  const month = params.month || getCurrentMonth();

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent month={month} />
    </Suspense>
  );
}
