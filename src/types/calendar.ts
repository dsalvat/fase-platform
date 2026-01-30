/**
 * Month state types for calendar
 */
export type MonthState = 'past' | 'current' | 'future-open' | 'future-locked';

/**
 * Week info for calendar navigation
 */
export interface WeekInfo {
  week: string; // YYYY-Wnn format
  startDate: Date;
  endDate: Date;
  days: Date[];
}

/**
 * Summary of a Big Rock for calendar display
 */
export interface BigRockSummary {
  id: string;
  title: string;
  status: string;
  numTars: number;
  completedTars: number;
}

/**
 * Summary of an activity for calendar display
 */
export interface ActivitySummary {
  id: string;
  title: string;
  completed: boolean;
  type: string;
  tarId: string;
  tarDescription: string;
  bigRockTitle: string;
}

/**
 * Summary of a meeting for calendar display
 */
export interface MeetingSummary {
  id: string;
  title: string;
  completed: boolean;
  bigRockId: string;
  bigRockTitle: string;
}

/**
 * Day data for calendar display
 */
export interface DayData {
  date: string; // YYYY-MM-DD format
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  activities: ActivitySummary[];
  meetings: MeetingSummary[];
}

/**
 * Month calendar data
 */
export interface MonthCalendarData {
  month: string; // YYYY-MM format
  state: MonthState;
  days: DayData[];
  bigRocks: BigRockSummary[];
  openMonths: string[];
}

/**
 * TAR with activities for weekly view
 */
export interface TARWithActivities {
  id: string;
  description: string;
  status: string;
  progress: number;
  bigRockId: string;
  bigRockTitle: string;
  activities: ActivitySummary[];
}

/**
 * Week calendar data
 */
export interface WeekCalendarData {
  week: string; // YYYY-Wnn format
  month: string; // YYYY-MM format
  state: MonthState;
  days: DayData[];
  tars: TARWithActivities[];
  weekLabel: string;
}

/**
 * Activity with TAR info for daily view
 */
export interface ActivityWithTARInfo {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: Date;
  week: string | null;
  completed: boolean;
  notes: string | null;
  tarId: string;
  tarDescription: string;
  bigRockId: string;
  bigRockTitle: string;
}

/**
 * Key meeting with Big Rock info for daily view
 */
export interface KeyMeetingWithBigRockInfo {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  completed: boolean;
  outcome: string | null;
  bigRockId: string;
  bigRockTitle: string;
}

/**
 * Day calendar data (detailed)
 */
export interface DayCalendarData {
  date: string; // YYYY-MM-DD format
  week: string; // YYYY-Wnn format
  month: string; // YYYY-MM format
  state: MonthState;
  activities: ActivityWithTARInfo[];
  meetings: KeyMeetingWithBigRockInfo[];
  dateLabel: string;
}

/**
 * Calendar view type
 */
export type CalendarView = 'month' | 'week' | 'day';

/**
 * Navigation direction
 */
export type NavigationDirection = 'prev' | 'next' | 'today';
