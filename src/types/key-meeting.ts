import { KeyMeeting, BigRock } from "@prisma/client";

/**
 * KeyMeeting with BigRock relation
 */
export type KeyMeetingWithBigRock = KeyMeeting & {
  bigRock: Pick<BigRock, 'id' | 'title' | 'month' | 'userId'>;
};

/**
 * KeyMeeting list item (minimal data for list views)
 */
export type KeyMeetingListItem = Pick<
  KeyMeeting,
  'id' | 'title' | 'date' | 'completed' | 'outcome' | 'createdAt'
>;

/**
 * KeyMeeting form data (for create/edit)
 */
export interface KeyMeetingFormData {
  title: string;
  description?: string | null;
  date: Date | string;
  bigRockId: string;
  completed?: boolean;
  outcome?: string | null;
}

/**
 * KeyMeeting statistics for a Big Rock
 */
export interface KeyMeetingStats {
  total: number;
  completed: number;
  pending: number;
  upcoming: number;
}

/**
 * Helper to format meeting date
 */
export function formatMeetingDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper to check if meeting is in the past
 */
export function isMeetingPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Helper to check if meeting is upcoming (within next 7 days)
 */
export function isMeetingUpcoming(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return d >= now && d <= weekFromNow;
}
