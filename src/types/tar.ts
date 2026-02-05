import { TAR, Activity, BigRock, TarStatus } from "@prisma/client";

/**
 * TAR with BigRock relation
 */
export type TARWithBigRock = TAR & {
  bigRock: Pick<BigRock, 'id' | 'title' | 'month' | 'userId'>;
};

/**
 * TAR with all relations
 */
export type TARWithRelations = TAR & {
  bigRock: Pick<BigRock, 'id' | 'title' | 'month' | 'userId'>;
  activities: Activity[];
};

/**
 * TAR list item (minimal data for list views)
 */
export type TARListItem = Pick<
  TAR,
  'id' | 'description' | 'status' | 'progress' | 'createdAt' | 'updatedAt'
> & {
  _count?: {
    activities: number;
  };
};

/**
 * TAR form data (for create/edit)
 */
export interface TARFormData {
  description: string;
  bigRockId: string;
  status?: TarStatus;
  progress?: number;
}

/**
 * TAR statistics for a Big Rock
 */
export interface TARStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  avgProgress: number;
}

/**
 * Status configuration for display
 */
export const tarStatusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    color: "text-gray-600 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  COMPLETADA: {
    label: "Completada",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/50",
    borderColor: "border-green-300 dark:border-green-700",
  },
} as const;
