import { BigRock, TAR, KeyMeeting, User, BigRockStatus, FaseCategory } from "@prisma/client";

/**
 * Key Person (User) linked to Big Rock
 */
export type BigRockKeyPersonUser = {
  id: string;
  userId: string;
  role: string | null;
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

/**
 * Big Rock with relations included
 */
export type BigRockWithRelations = BigRock & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  tars: TAR[];
  keyMeetings: KeyMeeting[];
  keyPeople: BigRockKeyPersonUser[];
};

/**
 * Big Rock with TAR count only
 */
export type BigRockWithCounts = BigRock & {
  user: Pick<User, 'id' | 'name'>;
  tars: Pick<TAR, 'id' | 'status' | 'progress'>[];
  keyPeople?: BigRockKeyPersonUser[];
  keyMeetings?: KeyMeeting[];
  _count: {
    keyMeetings: number;
    keyPeople?: number;
  };
};

/**
 * Big Rock list item (minimal data for list views)
 */
export type BigRockListItem = Pick<
  BigRock,
  'id' | 'title' | 'status' | 'month' | 'numTars' | 'aiScore' | 'category' | 'createdAt'
> & {
  _count?: {
    tars: number;
    keyMeetings: number;
  };
};

/**
 * Big Rock form data (for create/edit)
 */
export interface BigRockFormData {
  title: string;
  description: string;
  indicator: string;
  numTars: number;
  month: string;
  status?: BigRockStatus;
  category?: FaseCategory | null;
}

/**
 * Big Rock with AI feedback
 */
export type BigRockWithAI = BigRock & {
  aiScore: number | null;
  aiObservations: string | null;
  aiRecommendations: string | null;
  aiRisks: string | null;
};

/**
 * Big Rock statistics
 */
export interface BigRockStats {
  total: number;
  byStatus: Record<BigRockStatus, number>;
  avgAiScore: number | null;
  completionRate: number;
}

/**
 * Month view data
 */
export interface MonthViewData {
  month: string;
  isReadOnly: boolean;
  bigRocks: BigRockWithCounts[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
  };
}
