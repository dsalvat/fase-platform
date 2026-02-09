import { Feedback as PrismaFeedback, FeedbackTargetType } from "@prisma/client";

/**
 * Feedback with supervisor info
 */
export type FeedbackWithSupervisor = PrismaFeedback & {
  supervisor: {
    id: string;
    name: string | null;
  };
};

/**
 * Month planning status for displaying progress
 */
export interface MonthPlanningStatus {
  month: string;
  totalBigRocks: number;
  confirmedBigRocks: number;
  isPlanningConfirmed: boolean;
  planningConfirmedAt: Date | null;
  canConfirmPlanning: boolean; // true if all Big Rocks are confirmed
}

/**
 * Supervisee with planning status for supervisor dashboard
 */
export interface SuperviseeWithStatus {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  planningStatus: MonthPlanningStatus;
}

/**
 * Supervisee planning data for supervisor view
 */
export interface SuperviseePlanningData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  month: string;
  isPlanningConfirmed: boolean;
  planningConfirmedAt: Date | null;
  bigRocks: Array<{
    id: string;
    title: string;
    description: string;
    indicator: string;
    numTars: number;
    status: string;
    aiScore: number | null;
    aiObservations: string | null;
    aiRecommendations: string | null;
    aiRisks: string | null;
    tars: Array<{
      id: string;
      description: string;
      status: string;
    }>;
    keyMeetings: Array<{
      id: string;
      title: string;
      date: Date;
      completed: boolean;
    }>;
    keyPeople: Array<{
      id: string;
      role: string | null;
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    }>;
    feedback: FeedbackWithSupervisor | null;
  }>;
  monthFeedback: FeedbackWithSupervisor | null;
  monthAI: {
    score: number | null;
    observations: string | null;
    recommendations: string | null;
    risks: string | null;
  } | null;
}

export { FeedbackTargetType };
