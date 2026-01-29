import { TAR, Activity, KeyPerson, BigRock, TarStatus } from "@prisma/client";

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
  keyPeople: KeyPerson[];
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
    keyPeople: number;
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
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  COMPLETADA: {
    label: "Completada",
    color: "text-green-500",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
} as const;
