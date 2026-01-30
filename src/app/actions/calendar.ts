"use server";

import { revalidatePath } from "next/cache";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getCurrentMonth,
  getMonthState,
  getCalendarDays,
  getDaysInWeek,
  getMonthFromWeek,
  getWeekFromDate,
  getMonthFromDate,
  formatWeekLabel,
  formatDateLabel,
  isValidMonthFormat,
} from "@/lib/month-helpers";
import type {
  MonthCalendarData,
  WeekCalendarData,
  DayCalendarData,
  BigRockSummary,
  ActivitySummary,
  MeetingSummary,
  DayData,
  TARWithActivities,
  ActivityWithTARInfo,
  KeyMeetingWithBigRockInfo,
} from "@/types/calendar";

/**
 * Open a future month for planning
 * @param month - Month string in YYYY-MM format
 * @returns Success response
 */
export async function openMonth(month: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();

    // Validate month format
    if (!isValidMonthFormat(month)) {
      return {
        success: false,
        error: "Formato de mes inválido",
      };
    }

    const currentMonth = getCurrentMonth();

    // Can only open future months
    if (month <= currentMonth) {
      return {
        success: false,
        error: "Solo se pueden abrir meses futuros",
      };
    }

    // Check if already open
    const existing = await prisma.openMonth.findUnique({
      where: {
        month_userId: {
          month,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return {
        success: true, // Already open, consider it success
      };
    }

    // Create OpenMonth record
    await prisma.openMonth.create({
      data: {
        month,
        userId: user.id,
      },
    });

    revalidatePath("/calendario");
    revalidatePath(`/calendario?month=${month}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error opening month:", error);
    return {
      success: false,
      error: "Error al abrir el mes",
    };
  }
}

/**
 * Get user's open months
 * @returns Array of open month strings
 */
async function getUserOpenMonths(userId: string): Promise<string[]> {
  const openMonths = await prisma.openMonth.findMany({
    where: { userId },
    select: { month: true },
  });
  return openMonths.map((om) => om.month);
}

/**
 * Get month calendar data
 * @param month - Month string in YYYY-MM format (optional, defaults to current)
 * @returns MonthCalendarData
 */
export async function getMonthCalendarData(
  month?: string
): Promise<MonthCalendarData> {
  const user = await requireAuth();
  const targetMonth = month || getCurrentMonth();

  // Get user's open months
  const openMonths = await getUserOpenMonths(user.id);

  // Get month state
  const state = getMonthState(targetMonth, openMonths);

  // Get calendar days structure
  const calendarDays = getCalendarDays(targetMonth);

  // Get all Big Rocks for this month
  const bigRocks = await prisma.bigRock.findMany({
    where: {
      userId: user.id,
      month: targetMonth,
    },
    include: {
      tars: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  // Transform to BigRockSummary
  const bigRockSummaries: BigRockSummary[] = bigRocks.map((br) => ({
    id: br.id,
    title: br.title,
    status: br.status,
    numTars: br.numTars,
    completedTars: br.tars.filter((t) => t.status === "COMPLETADA").length,
  }));

  // Get activities and meetings for the calendar days
  const [year, monthNum] = targetMonth.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

  // Get activities
  const activities = await prisma.activity.findMany({
    where: {
      tar: {
        bigRock: {
          userId: user.id,
        },
      },
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      tar: {
        include: {
          bigRock: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // Get meetings
  const meetings = await prisma.keyMeeting.findMany({
    where: {
      bigRock: {
        userId: user.id,
        month: targetMonth,
      },
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Map activities and meetings to days
  const activityMap = new Map<string, ActivitySummary[]>();
  const meetingMap = new Map<string, MeetingSummary[]>();

  for (const activity of activities) {
    const dateKey = format(activity.date, "yyyy-MM-dd");
    if (!activityMap.has(dateKey)) {
      activityMap.set(dateKey, []);
    }
    activityMap.get(dateKey)!.push({
      id: activity.id,
      title: activity.title,
      completed: activity.completed,
      type: activity.type,
      tarId: activity.tarId,
      tarDescription: activity.tar.description,
      bigRockTitle: activity.tar.bigRock.title,
    });
  }

  for (const meeting of meetings) {
    const dateKey = format(meeting.date, "yyyy-MM-dd");
    if (!meetingMap.has(dateKey)) {
      meetingMap.set(dateKey, []);
    }
    meetingMap.get(dateKey)!.push({
      id: meeting.id,
      title: meeting.title,
      completed: meeting.completed,
      bigRockId: meeting.bigRockId,
      bigRockTitle: meeting.bigRock.title,
    });
  }

  // Build days data
  const days: DayData[] = calendarDays.map((day) => ({
    date: day.date,
    dayOfMonth: day.dayOfMonth,
    isToday: day.isToday,
    isCurrentMonth: day.isCurrentMonth,
    activities: activityMap.get(day.date) || [],
    meetings: meetingMap.get(day.date) || [],
  }));

  return {
    month: targetMonth,
    state,
    days,
    bigRocks: bigRockSummaries,
    openMonths,
  };
}

/**
 * Get week calendar data
 * @param week - Week string in YYYY-Wnn format
 * @returns WeekCalendarData
 */
export async function getWeekCalendarData(
  week: string
): Promise<WeekCalendarData> {
  const user = await requireAuth();

  // Get the month this week belongs to
  const month = getMonthFromWeek(week);

  // Get user's open months
  const openMonths = await getUserOpenMonths(user.id);

  // Get month state
  const state = getMonthState(month, openMonths);

  // Get days in this week
  const weekDays = getDaysInWeek(week);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  // Get activities for this week
  const activities = await prisma.activity.findMany({
    where: {
      tar: {
        bigRock: {
          userId: user.id,
        },
      },
      date: {
        gte: startOfDay(weekStart),
        lte: endOfDay(weekEnd),
      },
    },
    include: {
      tar: {
        include: {
          bigRock: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // Get meetings for this week
  const meetings = await prisma.keyMeeting.findMany({
    where: {
      bigRock: {
        userId: user.id,
      },
      date: {
        gte: startOfDay(weekStart),
        lte: endOfDay(weekEnd),
      },
    },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Get unique TARs from activities
  const tarIds = [...new Set(activities.map((a) => a.tarId))];
  const tars = await prisma.tAR.findMany({
    where: {
      id: { in: tarIds },
    },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
      activities: {
        where: {
          date: {
            gte: startOfDay(weekStart),
            lte: endOfDay(weekEnd),
          },
        },
      },
    },
  });

  // Build TARWithActivities
  const tarsWithActivities: TARWithActivities[] = tars.map((tar) => ({
    id: tar.id,
    description: tar.description,
    status: tar.status,
    progress: tar.progress,
    bigRockId: tar.bigRockId,
    bigRockTitle: tar.bigRock.title,
    activities: tar.activities.map((a) => ({
      id: a.id,
      title: a.title,
      completed: a.completed,
      type: a.type,
      tarId: a.tarId,
      tarDescription: tar.description,
      bigRockTitle: tar.bigRock.title,
      })),
  }));

  // Map activities and meetings to days
  const activityMap = new Map<string, ActivitySummary[]>();
  const meetingMap = new Map<string, MeetingSummary[]>();

  for (const activity of activities) {
    const dateKey = format(activity.date, "yyyy-MM-dd");
    if (!activityMap.has(dateKey)) {
      activityMap.set(dateKey, []);
    }
    activityMap.get(dateKey)!.push({
      id: activity.id,
      title: activity.title,
      completed: activity.completed,
      type: activity.type,
      tarId: activity.tarId,
      tarDescription: activity.tar.description,
      bigRockTitle: activity.tar.bigRock.title,
    });
  }

  for (const meeting of meetings) {
    const dateKey = format(meeting.date, "yyyy-MM-dd");
    if (!meetingMap.has(dateKey)) {
      meetingMap.set(dateKey, []);
    }
    meetingMap.get(dateKey)!.push({
      id: meeting.id,
      title: meeting.title,
      completed: meeting.completed,
      bigRockId: meeting.bigRockId,
      bigRockTitle: meeting.bigRock.title,
    });
  }

  // Build days data
  const today = format(new Date(), "yyyy-MM-dd");
  const days: DayData[] = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return {
      date: dateStr,
      dayOfMonth: day.getDate(),
      isToday: dateStr === today,
      isCurrentMonth: getMonthFromDate(dateStr) === month,
      activities: activityMap.get(dateStr) || [],
      meetings: meetingMap.get(dateStr) || [],
    };
  });

  return {
    week,
    month,
    state,
    days,
    tars: tarsWithActivities,
    weekLabel: formatWeekLabel(week),
  };
}

/**
 * Get day calendar data
 * @param date - Date string in YYYY-MM-DD format
 * @returns DayCalendarData
 */
export async function getDayCalendarData(
  date: string
): Promise<DayCalendarData> {
  const user = await requireAuth();

  const parsedDate = parseISO(date);
  const month = getMonthFromDate(date);
  const week = getWeekFromDate(date);

  // Get user's open months
  const openMonths = await getUserOpenMonths(user.id);

  // Get month state
  const state = getMonthState(month, openMonths);

  // Get activities for this day
  const activities = await prisma.activity.findMany({
    where: {
      tar: {
        bigRock: {
          userId: user.id,
        },
      },
      date: {
        gte: startOfDay(parsedDate),
        lte: endOfDay(parsedDate),
      },
    },
    include: {
      tar: {
        include: {
          bigRock: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Get meetings for this day
  const meetings = await prisma.keyMeeting.findMany({
    where: {
      bigRock: {
        userId: user.id,
      },
      date: {
        gte: startOfDay(parsedDate),
        lte: endOfDay(parsedDate),
      },
    },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Transform activities
  const activitiesWithTAR: ActivityWithTARInfo[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type,
    date: a.date,
    week: a.week,
    completed: a.completed,
    notes: a.notes,
    tarId: a.tarId,
    tarDescription: a.tar.description,
    bigRockId: a.tar.bigRockId,
    bigRockTitle: a.tar.bigRock.title,
  }));

  // Transform meetings
  const meetingsWithBigRock: KeyMeetingWithBigRockInfo[] = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.date,
    completed: m.completed,
    outcome: m.outcome,
    bigRockId: m.bigRockId,
    bigRockTitle: m.bigRock.title,
  }));

  return {
    date,
    week,
    month,
    state,
    activities: activitiesWithTAR,
    meetings: meetingsWithBigRock,
    dateLabel: formatDateLabel(date),
  };
}
