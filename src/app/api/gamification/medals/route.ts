import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { MEDAL_CONFIG, MEDAL_LEVEL_CONFIG } from "@/types/gamification";
import { MedalType, MedalLevel } from "@prisma/client";

/**
 * GET /api/gamification/medals
 * Get current user's medals with detailed info
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const gamification = await prisma.gamification.findUnique({
      where: { userId: user.id },
      include: {
        medals: {
          orderBy: { earnedAt: "desc" },
        },
      },
    });

    if (!gamification) {
      return successResponse({
        earned: [],
        available: getAllMedalTypes(),
        progress: getInitialProgress(),
      });
    }

    // Map earned medals with full info
    const earned = gamification.medals.map((medal) => ({
      id: medal.id,
      type: medal.type,
      level: medal.level,
      earnedAt: medal.earnedAt,
      config: {
        ...MEDAL_CONFIG[medal.type],
        levelConfig: MEDAL_LEVEL_CONFIG[medal.level],
      },
    }));

    // Calculate progress towards next medals
    const progress = calculateMedalProgress(gamification);

    // Get available medals (not yet earned)
    const earnedSet = new Set(
      gamification.medals.map((m) => `${m.type}-${m.level}`)
    );
    const available = getAllMedalTypes().filter(
      (m) => !earnedSet.has(`${m.type}-${m.level}`)
    );

    return successResponse({
      earned,
      available,
      progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get all possible medal type/level combinations
 */
function getAllMedalTypes() {
  const types: MedalType[] = [
    "CONSTANCIA",
    "CLARIDAD",
    "EJECUCION",
    "MEJORA_CONTINUA",
  ];
  const levels: MedalLevel[] = ["BRONCE", "PLATA", "ORO", "DIAMANTE"];

  return types.flatMap((type) =>
    levels.map((level) => ({
      type,
      level,
      config: {
        ...MEDAL_CONFIG[type],
        levelConfig: MEDAL_LEVEL_CONFIG[level],
        threshold: MEDAL_CONFIG[type].thresholds[level],
      },
    }))
  );
}

/**
 * Get initial progress for users without gamification record
 */
function getInitialProgress() {
  return {
    CONSTANCIA: {
      current: 0,
      nextLevel: "BRONCE" as MedalLevel,
      nextThreshold: MEDAL_CONFIG.CONSTANCIA.thresholds.BRONCE,
      percentage: 0,
    },
    CLARIDAD: {
      current: 0,
      nextLevel: "BRONCE" as MedalLevel,
      nextThreshold: MEDAL_CONFIG.CLARIDAD.thresholds.BRONCE,
      percentage: 0,
    },
    EJECUCION: {
      current: 0,
      nextLevel: "BRONCE" as MedalLevel,
      nextThreshold: MEDAL_CONFIG.EJECUCION.thresholds.BRONCE,
      percentage: 0,
    },
    MEJORA_CONTINUA: {
      current: 0,
      nextLevel: "BRONCE" as MedalLevel,
      nextThreshold: MEDAL_CONFIG.MEJORA_CONTINUA.thresholds.BRONCE,
      percentage: 0,
    },
  };
}

/**
 * Calculate progress towards each medal type
 */
function calculateMedalProgress(gamification: {
  longestStreak: number;
  bigRocksCreated: number;
  tarsCompleted: number;
  weeklyReviews: number;
  medals: { type: MedalType; level: MedalLevel }[];
}) {
  const levels: MedalLevel[] = ["BRONCE", "PLATA", "ORO", "DIAMANTE"];

  const getNextLevel = (
    type: MedalType,
    currentValue: number
  ): { level: MedalLevel; threshold: number } | null => {
    const earnedLevels = new Set(
      gamification.medals.filter((m) => m.type === type).map((m) => m.level)
    );

    for (const level of levels) {
      const threshold = MEDAL_CONFIG[type].thresholds[level];
      if (!earnedLevels.has(level) && currentValue < threshold) {
        return { level, threshold };
      }
    }

    // Check if there's a level earned but not the next one
    for (const level of levels) {
      const threshold = MEDAL_CONFIG[type].thresholds[level];
      if (!earnedLevels.has(level)) {
        return { level, threshold };
      }
    }

    return null; // All medals earned
  };

  const calculateProgressForType = (type: MedalType, currentValue: number) => {
    const next = getNextLevel(type, currentValue);
    if (!next) {
      return {
        current: currentValue,
        nextLevel: null,
        nextThreshold: null,
        percentage: 100,
        completed: true,
      };
    }

    const percentage = Math.min(
      100,
      Math.round((currentValue / next.threshold) * 100)
    );

    return {
      current: currentValue,
      nextLevel: next.level,
      nextThreshold: next.threshold,
      percentage,
      completed: false,
    };
  };

  return {
    CONSTANCIA: calculateProgressForType("CONSTANCIA", gamification.longestStreak),
    CLARIDAD: calculateProgressForType("CLARIDAD", gamification.bigRocksCreated),
    EJECUCION: calculateProgressForType("EJECUCION", gamification.tarsCompleted),
    MEJORA_CONTINUA: calculateProgressForType(
      "MEJORA_CONTINUA",
      gamification.weeklyReviews
    ),
  };
}
