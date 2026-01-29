import { Activity, TAR, ActivityType } from "@prisma/client";

/**
 * Activity with TAR relation
 */
export type ActivityWithTAR = Activity & {
  tar: Pick<TAR, 'id' | 'description' | 'bigRockId'>;
};

/**
 * Activity list item
 */
export type ActivityListItem = Pick<
  Activity,
  'id' | 'title' | 'type' | 'date' | 'completed' | 'createdAt'
>;

/**
 * Activity form data
 */
export interface ActivityFormData {
  title: string;
  description?: string | null;
  type: ActivityType;
  date: Date;
  week?: string | null;
  tarId: string;
  completed?: boolean;
  notes?: string | null;
}

/**
 * Activity statistics for a TAR
 */
export interface ActivityStats {
  total: number;
  completed: number;
  pending: number;
  weekly: number;
  daily: number;
}

/**
 * Activity type configuration for display
 */
export const activityTypeConfig = {
  SEMANAL: {
    label: "Semanal",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  DIARIA: {
    label: "Diaria",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
} as const;

/**
 * Activity completion status configuration
 */
export const activityCompletionConfig = {
  completed: {
    label: "Completada",
    color: "text-green-500",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  pending: {
    label: "Pendiente",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
} as const;
