/**
 * Types for inline form data during BigRock creation/editing
 */

/**
 * Key Person selection (User ID with optional role in context of Big Rock)
 */
export interface KeyPersonSelection {
  userId: string;
  role?: string | null;
}

/**
 * Inline Key Meeting data (for creating KeyMeeting during BigRock form)
 */
export interface InlineKeyMeeting {
  title: string;
  objective: string;
  expectedDecision?: string | null;
  date: string;
  description?: string | null;
}

/**
 * Data passed to BigRock form for key people and meetings
 */
export interface BigRockKeyDataInput {
  selectedKeyPeopleIds: string[];  // User IDs selected as key people
  keyMeetings: InlineKeyMeeting[];
}
