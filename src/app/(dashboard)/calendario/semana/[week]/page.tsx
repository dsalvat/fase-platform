import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getWeekCalendarData } from "@/app/actions/calendar";
import { CalendarHeader, WeeklyView } from "@/components/calendar";

interface SemanaPageProps {
  params: Promise<{ week: string }>;
}

async function WeekContent({ week }: { week: string }) {
  try {
    const data = await getWeekCalendarData(week);

    return (
      <div className="space-y-6">
        <CalendarHeader
          title={data.weekLabel}
          view="week"
          currentValue={data.week}
          state={data.state}
          month={data.month}
          week={data.week}
        />
        <WeeklyView data={data} />
      </div>
    );
  } catch (error) {
    console.error("Error loading week data:", error);
    notFound();
  }
}

function WeekSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-[400px] animate-pulse rounded-lg bg-gray-200" />
      <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
    </div>
  );
}

export default async function SemanaPage({ params }: SemanaPageProps) {
  const { week } = await params;

  // Validate week format (YYYY-Wnn)
  if (!/^\d{4}-W\d{2}$/.test(week)) {
    notFound();
  }

  return (
    <Suspense fallback={<WeekSkeleton />}>
      <WeekContent week={week} />
    </Suspense>
  );
}
