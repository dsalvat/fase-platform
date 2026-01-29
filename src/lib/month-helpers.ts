import { format } from "date-fns";
import { es } from "date-fns/locale";

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
