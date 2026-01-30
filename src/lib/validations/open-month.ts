import { z } from "zod";

/**
 * Schema for month parameter (YYYY-MM format)
 */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El mes debe estar en formato YYYY-MM");

/**
 * Schema for opening a month
 */
export const openMonthSchema = z.object({
  month: monthSchema,
});

/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get the next month from a given month
 */
export function getNextMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (monthNum === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(monthNum + 1).padStart(2, "0")}`;
}

/**
 * Get the previous month from a given month
 */
export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (monthNum === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(monthNum - 1).padStart(2, "0")}`;
}

/**
 * Check if a month is in the past
 */
export function isMonthPast(month: string): boolean {
  const current = getCurrentMonth();
  return month < current;
}

/**
 * Check if a month is in the future
 */
export function isMonthFuture(month: string): boolean {
  const current = getCurrentMonth();
  return month > current;
}

/**
 * Check if a month is the current month
 */
export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth();
}

/**
 * Get month label for display
 */
export function getMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

// Type exports
export type OpenMonthInput = z.infer<typeof openMonthSchema>;
