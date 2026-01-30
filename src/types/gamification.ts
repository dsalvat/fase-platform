import { Gamification, Medal, MedalType, MedalLevel } from "@prisma/client";

/**
 * Gamification with medals included
 */
export type GamificationWithMedals = Gamification & {
  medals: Medal[];
};

/**
 * Points configuration for different actions
 */
export const POINTS_CONFIG = {
  CREATE_BIG_ROCK: 50,
  WEEKLY_PLANNING: 30,
  WEEKLY_REVIEW: 40,
  DAILY_LOG: 10,
  COMPLETE_TAR: 25,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
} as const;

/**
 * Medal configuration with thresholds
 */
export const MEDAL_CONFIG: Record<
  MedalType,
  {
    label: string;
    description: string;
    icon: string;
    thresholds: Record<MedalLevel, number>;
    field: keyof Gamification;
  }
> = {
  CONSTANCIA: {
    label: "Constancia",
    description: "Por mantener rachas consecutivas de registro",
    icon: "flame",
    thresholds: {
      BRONCE: 7,
      PLATA: 30,
      ORO: 90,
      DIAMANTE: 365,
    },
    field: "longestStreak",
  },
  CLARIDAD: {
    label: "Claridad",
    description: "Por definir Big Rocks con alta calidad (score IA)",
    icon: "target",
    thresholds: {
      BRONCE: 5, // 5 Big Rocks con score >70
      PLATA: 15, // 15 Big Rocks con score >80
      ORO: 50, // 50 Big Rocks con score >90
      DIAMANTE: 100, // 100 Big Rocks con score >95
    },
    field: "bigRocksCreated", // Note: This requires special handling with AI scores
  },
  EJECUCION: {
    label: "Ejecucion",
    description: "Por completar Tareas de Alto Rendimiento",
    icon: "check-circle",
    thresholds: {
      BRONCE: 10,
      PLATA: 50,
      ORO: 200,
      DIAMANTE: 500,
    },
    field: "tarsCompleted",
  },
  MEJORA_CONTINUA: {
    label: "Mejora Continua",
    description: "Por realizar revisiones semanales",
    icon: "refresh-cw",
    thresholds: {
      BRONCE: 10,
      PLATA: 50,
      ORO: 200,
      DIAMANTE: 500,
    },
    field: "weeklyReviews",
  },
};

/**
 * Medal level configuration
 */
export const MEDAL_LEVEL_CONFIG: Record<
  MedalLevel,
  { label: string; color: string; bgColor: string }
> = {
  BRONCE: {
    label: "Bronce",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  PLATA: {
    label: "Plata",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  ORO: {
    label: "Oro",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  DIAMANTE: {
    label: "Diamante",
    color: "text-cyan-500",
    bgColor: "bg-cyan-100",
  },
};

/**
 * Level thresholds (points required for each level)
 */
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  2000, // Level 6
  3500, // Level 7
  5000, // Level 8
  7500, // Level 9
  10000, // Level 10
] as const;

/**
 * Get level from points
 */
export function getLevelFromPoints(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return Infinity;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgress(points: number): number {
  const currentLevel = getLevelFromPoints(points);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 100;
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const progress =
    ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Point action type for tracking
 */
export type PointAction =
  | "CREATE_BIG_ROCK"
  | "WEEKLY_PLANNING"
  | "WEEKLY_REVIEW"
  | "DAILY_LOG"
  | "COMPLETE_TAR"
  | "STREAK_7_DAYS"
  | "STREAK_30_DAYS";

/**
 * Gamification summary for display
 */
export interface GamificationSummary {
  points: number;
  level: number;
  levelProgress: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  medals: {
    type: MedalType;
    level: MedalLevel;
    label: string;
    earnedAt: Date;
  }[];
  stats: {
    bigRocksCreated: number;
    tarsCompleted: number;
    weeklyReviews: number;
    dailyLogs: number;
  };
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage?: string;
  points: number;
  level: number;
  medalCount: number;
}
