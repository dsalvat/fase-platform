import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, getYear, addDays, startOfMonth, endOfMonth, isSameMonth, isToday as isTodayFn, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { MonthState, WeekInfo } from "@/types/calendar";

/**
 * Check if a month is read-only (in the past)
 * @param month - Month string in YYYY-MM format
 * @returns true if month is in the past, false otherwise
 */
export function isMonthReadOnly(month: string): boolean {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return month < currentMonth;
}

/**
 * Get current month in YYYY-MM format
 * @returns Current month string
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get the next month from a given month or current month
 * @param month - Month string in YYYY-MM format (optional)
 * @returns Next month in YYYY-MM format
 */
export function getNextMonth(month?: string): string {
  const base = month || getCurrentMonth();
  const [year, monthNum] = base.split('-').map(Number);

  if (monthNum === 12) {
    return `${year + 1}-01`;
  }

  return `${year}-${String(monthNum + 1).padStart(2, '0')}`;
}

/**
 * Get the previous month from a given month
 * @param month - Month string in YYYY-MM format
 * @returns Previous month in YYYY-MM format
 */
export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);

  if (monthNum === 1) {
    return `${year - 1}-12`;
  }

  return `${year}-${String(monthNum - 1).padStart(2, '0')}`;
}

/**
 * Format month for display (e.g., "Enero 2026", "Febrero 2026")
 * @param month - Month string in YYYY-MM format
 * @returns Formatted month string in Spanish
 */
export function formatMonthLabel(month: string): string {
  try {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1);
    return format(date, 'MMMM yyyy', { locale: es });
  } catch {
    return month;
  }
}

/**
 * Format month for display (short version, e.g., "Ene 2026")
 * @param month - Month string in YYYY-MM format
 * @returns Short formatted month string in Spanish
 */
export function formatMonthShort(month: string): string {
  try {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1);
    return format(date, 'MMM yyyy', { locale: es });
  } catch {
    return month;
  }
}

/**
 * Generate an array of month options for selectors
 * @param count - Number of months to generate (default: 12)
 * @param startMonth - Starting month (default: current month)
 * @returns Array of {value, label} objects
 */
export function generateMonthOptions(
  count = 12,
  startMonth?: string
): Array<{ value: string; label: string }> {
  const start = startMonth || getCurrentMonth();
  const options: Array<{ value: string; label: string }> = [];

  let currentMonth = start;
  for (let i = 0; i < count; i++) {
    options.push({
      value: currentMonth,
      label: formatMonthLabel(currentMonth),
    });
    currentMonth = getNextMonth(currentMonth);
  }

  return options;
}

/**
 * Check if a month is valid format (YYYY-MM)
 * @param month - Month string to validate
 * @returns true if valid format, false otherwise
 */
export function isValidMonthFormat(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

/**
 * Compare two months
 * @param month1 - First month (YYYY-MM)
 * @param month2 - Second month (YYYY-MM)
 * @returns -1 if month1 < month2, 0 if equal, 1 if month1 > month2
 */
export function compareMonths(month1: string, month2: string): number {
  if (month1 === month2) return 0;
  return month1 < month2 ? -1 : 1;
}

/**
 * Get the state of a month based on current date and open months
 * @param month - Month string in YYYY-MM format
 * @param openMonths - Array of open month strings
 * @returns MonthState: 'past', 'current', 'future-open', or 'future-locked'
 */
export function getMonthState(month: string, openMonths: string[] = []): MonthState {
  const currentMonth = getCurrentMonth();

  if (month < currentMonth) {
    return 'past';
  }

  if (month === currentMonth) {
    return 'current';
  }

  // Future month
  if (openMonths.includes(month)) {
    return 'future-open';
  }

  return 'future-locked';
}

/**
 * Check if a month is editable (current or future-open)
 * @param month - Month string in YYYY-MM format
 * @param openMonths - Array of open month strings
 * @returns true if month is editable
 */
export function isMonthEditable(month: string, openMonths: string[] = []): boolean {
  const state = getMonthState(month, openMonths);
  return state === 'current' || state === 'future-open';
}

/**
 * Get weeks in a month
 * @param month - Month string in YYYY-MM format
 * @returns Array of WeekInfo objects
 */
export function getWeeksInMonth(month: string): WeekInfo[] {
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, monthNum - 1));
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));

  const weeks: WeekInfo[] = [];
  let currentDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday

  while (currentDate <= monthEnd || isSameMonth(currentDate, monthStart)) {
    const weekStart = currentDate;
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekNum = getWeek(currentDate, { weekStartsOn: 1 });
    const weekYear = getYear(weekStart);

    weeks.push({
      week: `${weekYear}-W${String(weekNum).padStart(2, '0')}`,
      startDate: weekStart,
      endDate: weekEnd,
      days: eachDayOfInterval({ start: weekStart, end: weekEnd }),
    });

    currentDate = addDays(weekEnd, 1);

    // Stop if we've gone past the month end
    if (currentDate > monthEnd && !isSameMonth(currentDate, monthStart)) {
      break;
    }
  }

  return weeks;
}

/**
 * Get days in a week
 * @param week - Week string in YYYY-Wnn format
 * @returns Array of Date objects
 */
export function getDaysInWeek(week: string): Date[] {
  const [yearStr, weekStr] = week.split('-W');
  const year = parseInt(yearStr);
  const weekNum = parseInt(weekStr);

  // Find the first day of the year
  const jan1 = new Date(year, 0, 1);

  // Find the first Monday of the year
  const firstMonday = startOfWeek(jan1, { weekStartsOn: 1 });

  // Calculate the start of the target week
  const weekStart = addDays(firstMonday, (weekNum - 1) * 7);
  const weekEnd = addDays(weekStart, 6);

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Format week label for display
 * @param week - Week string in YYYY-Wnn format
 * @returns Formatted string like "Semana 5 - Febrero 2026"
 */
export function formatWeekLabel(week: string): string {
  const days = getDaysInWeek(week);
  if (days.length === 0) return week;

  const midWeek = days[3] || days[0]; // Use Thursday or first day
  const weekNum = week.split('-W')[1];

  return `Semana ${parseInt(weekNum)} - ${format(midWeek, 'MMMM yyyy', { locale: es })}`;
}

/**
 * Get month from a week string
 * @param week - Week string in YYYY-Wnn format
 * @returns Month string in YYYY-MM format (based on Thursday of the week)
 */
export function getMonthFromWeek(week: string): string {
  const days = getDaysInWeek(week);
  if (days.length === 0) {
    const [year] = week.split('-W');
    return `${year}-01`;
  }

  const thursday = days[3] || days[0];
  return format(thursday, 'yyyy-MM');
}

/**
 * Get week string from a date
 * @param date - Date object or string
 * @returns Week string in YYYY-Wnn format
 */
export function getWeekFromDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const weekNum = getWeek(d, { weekStartsOn: 1 });
  const year = getYear(d);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get month from a date string
 * @param date - Date string in YYYY-MM-DD format
 * @returns Month string in YYYY-MM format
 */
export function getMonthFromDate(date: string): string {
  return date.substring(0, 7);
}

/**
 * Format date label for display
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted string like "Miércoles, 29 de enero de 2026"
 */
export function formatDateLabel(date: string): string {
  try {
    const d = parseISO(date);
    return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return date;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Date string
 */
export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current week in YYYY-Wnn format
 * @returns Week string
 */
export function getCurrentWeek(): string {
  return getWeekFromDate(new Date());
}

/**
 * Check if a date is today
 * @param date - Date string in YYYY-MM-DD format
 * @returns true if date is today
 */
export function isToday(date: string): boolean {
  try {
    return isTodayFn(parseISO(date));
  } catch {
    return false;
  }
}

/**
 * Get days in a month with calendar grid (including days from adjacent months)
 * @param month - Month string in YYYY-MM format
 * @returns Array of objects with date info
 */
export function getCalendarDays(month: string): { date: string; dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean }[] {
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, monthNum - 1));
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));

  // Get the first day of the calendar grid (Monday of the week containing month start)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Get the last day of the calendar grid (Sunday of the week containing month end)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map(day => ({
    date: format(day, 'yyyy-MM-dd'),
    dayOfMonth: day.getDate(),
    isCurrentMonth: isSameMonth(day, monthStart),
    isToday: isTodayFn(day),
  }));
}
