/**
 * Types for inline form data during BigRock creation/editing
 */

/**
 * Inline Key Person data (for creating new KeyPerson during BigRock form)
 */
export interface InlineKeyPerson {
  firstName: string;
  lastName: string;
  role?: string | null;
  contact?: string | null;
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
  selectedKeyPeopleIds: string[];
  newKeyPeople: InlineKeyPerson[];
  keyMeetings: InlineKeyMeeting[];
}
