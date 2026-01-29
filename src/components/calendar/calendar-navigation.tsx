"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getCurrentMonth,
  getNextMonth,
  getPreviousMonth,
  getCurrentWeek,
  getTodayDate,
} from "@/lib/month-helpers";
import type { CalendarView } from "@/types/calendar";

interface CalendarNavigationProps {
  view: CalendarView;
  currentValue: string; // month (YYYY-MM), week (YYYY-Wnn), or date (YYYY-MM-DD)
}

export function CalendarNavigation({
  view,
  currentValue,
}: CalendarNavigationProps) {
  const getNavigationLinks = () => {
    switch (view) {
      case "month": {
        const prevMonth = getPreviousMonth(currentValue);
        const nextMonth = getNextMonth(currentValue);
        const today = getCurrentMonth();
        return {
          prev: `/calendario?month=${prevMonth}`,
          next: `/calendario?month=${nextMonth}`,
          today: `/calendario?month=${today}`,
          showToday: currentValue !== today,
        };
      }
      case "week": {
        // Parse week and calculate prev/next
        const [yearStr, weekStr] = currentValue.split("-W");
        const year = parseInt(yearStr);
        const weekNum = parseInt(weekStr);

        let prevWeek: string;
        let nextWeek: string;

        if (weekNum === 1) {
          prevWeek = `${year - 1}-W52`;
        } else {
          prevWeek = `${year}-W${String(weekNum - 1).padStart(2, "0")}`;
        }

        if (weekNum >= 52) {
          nextWeek = `${year + 1}-W01`;
        } else {
          nextWeek = `${year}-W${String(weekNum + 1).padStart(2, "0")}`;
        }

        const todayWeek = getCurrentWeek();
        return {
          prev: `/calendario/semana/${prevWeek}`,
          next: `/calendario/semana/${nextWeek}`,
          today: `/calendario/semana/${todayWeek}`,
          showToday: currentValue !== todayWeek,
        };
      }
      case "day": {
        // Parse date and calculate prev/next
        const date = new Date(currentValue);
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const formatDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const todayDate = getTodayDate();
        return {
          prev: `/calendario/dia/${formatDate(prevDate)}`,
          next: `/calendario/dia/${formatDate(nextDate)}`,
          today: `/calendario/dia/${todayDate}`,
          showToday: currentValue !== todayDate,
        };
      }
    }
  };

  const links = getNavigationLinks();

  return (
    <div className="flex items-center gap-2">
      <Link href={links.prev}>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="sr-only">Anterior</span>
        </Button>
      </Link>

      {links.showToday && (
        <Link href={links.today}>
          <Button variant="outline" size="sm">
            Hoy
          </Button>
        </Link>
      )}

      <Link href={links.next}>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="sr-only">Siguiente</span>
        </Button>
      </Link>
    </div>
  );
}
