import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDayCalendarData } from "@/app/actions/calendar";
import { CalendarHeader, DailyView } from "@/components/calendar";

interface DiaPageProps {
  params: Promise<{ date: string }>;
}

async function DayContent({ date }: { date: string }) {
  try {
    const data = await getDayCalendarData(date);

    return (
      <div className="space-y-6">
        <CalendarHeader
          title={data.dateLabel}
          view="day"
          currentValue={data.date}
          state={data.state}
          month={data.month}
          week={data.week}
        />
        <DailyView data={data} />
      </div>
    );
  } catch (error) {
    console.error("Error loading day data:", error);
    notFound();
  }
}

function DaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
    </div>
  );
}

export default async function DiaPage({ params }: DiaPageProps) {
  const { date } = await params;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  // Validate it's a real date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    notFound();
  }

  return (
    <Suspense fallback={<DaySkeleton />}>
      <DayContent date={date} />
    </Suspense>
  );
}
