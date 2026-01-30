import { prisma } from "@/lib/db";
import { MedalType, MedalLevel } from "@prisma/client";
import {
  POINTS_CONFIG,
  MEDAL_CONFIG,
  getLevelFromPoints,
  PointAction,
} from "@/types/gamification";

/**
 * Award points to a user for an action
 */
export async function awardPoints(
  userId: string,
  action: PointAction,
  customPoints?: number
): Promise<{ points: number; newTotal: number; levelUp: boolean; newLevel: number }> {
  const points = customPoints ?? POINTS_CONFIG[action];

  const gamification = await prisma.gamification.upsert({
    where: { userId },
    create: {
      userId,
      points,
      level: getLevelFromPoints(points),
    },
    update: {
      points: { increment: points },
    },
  });

  const newLevel = getLevelFromPoints(gamification.points);
  const levelUp = newLevel > gamification.level;

  // Update level if changed
  if (levelUp) {
    await prisma.gamification.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  return {
    points,
    newTotal: gamification.points,
    levelUp,
    newLevel,
  };
}

/**
 * Increment a counter and check for medals
 */
export async function incrementCounter(
  userId: string,
  counter: "bigRocksCreated" | "tarsCompleted" | "weeklyReviews" | "dailyLogs"
): Promise<{ newValue: number; newMedal?: { type: MedalType; level: MedalLevel } }> {
  const gamification = await prisma.gamification.upsert({
    where: { userId },
    create: {
      userId,
      [counter]: 1,
    },
    update: {
      [counter]: { increment: 1 },
    },
    include: {
      medals: true,
    },
  });

  const newValue = gamification[counter] as number;

  // Check for new medals based on the counter
  const medalType = getMedalTypeForCounter(counter);
  if (medalType) {
    const newMedal = await checkAndAwardMedal(userId, medalType, newValue, gamification.medals);
    if (newMedal) {
      return { newValue, newMedal };
    }
  }

  return { newValue };
}

/**
 * Get the medal type associated with a counter
 */
function getMedalTypeForCounter(
  counter: "bigRocksCreated" | "tarsCompleted" | "weeklyReviews" | "dailyLogs"
): MedalType | null {
  switch (counter) {
    case "bigRocksCreated":
      return "CLARIDAD";
    case "tarsCompleted":
      return "EJECUCION";
    case "weeklyReviews":
      return "MEJORA_CONTINUA";
    case "dailyLogs":
      return null; // Daily logs contribute to streak, not a specific medal
    default:
      return null;
  }
}

/**
 * Check if user qualifies for a new medal and award it
 */
async function checkAndAwardMedal(
  userId: string,
  medalType: MedalType,
  currentValue: number,
  existingMedals: { type: MedalType; level: MedalLevel }[]
): Promise<{ type: MedalType; level: MedalLevel } | null> {
  const config = MEDAL_CONFIG[medalType];
  const thresholds = config.thresholds;

  // Check each level from highest to lowest
  const levels: MedalLevel[] = ["DIAMANTE", "ORO", "PLATA", "BRONCE"];

  for (const level of levels) {
    const threshold = thresholds[level];

    // Check if user meets threshold
    if (currentValue >= threshold) {
      // Check if user already has this medal at this level
      const hasMedal = existingMedals.some(
        (m) => m.type === medalType && m.level === level
      );

      if (!hasMedal) {
        // Award the medal
        const gamification = await prisma.gamification.findUnique({
          where: { userId },
        });

        if (gamification) {
          await prisma.medal.create({
            data: {
              type: medalType,
              level,
              gamificationId: gamification.id,
            },
          });

          return { type: medalType, level };
        }
      }
    }
  }

  return null;
}

/**
 * Update user's streak
 */
export async function updateStreak(
  userId: string,
  increment: boolean = true
): Promise<{
  currentStreak: number;
  longestStreak: number;
  newMedal?: { type: MedalType; level: MedalLevel };
  streakBonus?: number;
}> {
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
    include: { medals: true },
  });

  if (!gamification) {
    // Create new gamification record
    const newGamification = await prisma.gamification.create({
      data: {
        userId,
        currentStreak: increment ? 1 : 0,
        longestStreak: increment ? 1 : 0,
      },
    });

    return {
      currentStreak: newGamification.currentStreak,
      longestStreak: newGamification.longestStreak,
    };
  }

  let newCurrentStreak: number;
  let newLongestStreak: number;
  let streakBonus: number | undefined;

  if (increment) {
    newCurrentStreak = gamification.currentStreak + 1;
    newLongestStreak = Math.max(gamification.longestStreak, newCurrentStreak);

    // Check for streak bonuses
    if (newCurrentStreak === 7) {
      streakBonus = POINTS_CONFIG.STREAK_7_DAYS;
    } else if (newCurrentStreak === 30) {
      streakBonus = POINTS_CONFIG.STREAK_30_DAYS;
    }
  } else {
    newCurrentStreak = 0;
    newLongestStreak = gamification.longestStreak;
  }

  // Update streak
  await prisma.gamification.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      ...(streakBonus && { points: { increment: streakBonus } }),
    },
  });

  // Check for CONSTANCIA medal based on longest streak
  const newMedal = await checkAndAwardMedal(
    userId,
    "CONSTANCIA",
    newLongestStreak,
    gamification.medals
  );

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    newMedal: newMedal || undefined,
    streakBonus,
  };
}

/**
 * Get user's gamification summary
 */
export async function getGamificationSummary(userId: string) {
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
    include: {
      medals: {
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  if (!gamification) {
    return null;
  }

  const level = getLevelFromPoints(gamification.points);

  return {
    ...gamification,
    level,
    medals: gamification.medals.map((m) => ({
      ...m,
      config: MEDAL_CONFIG[m.type],
    })),
  };
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10) {
  const gamifications = await prisma.gamification.findMany({
    take: limit,
    orderBy: { points: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          medals: true,
        },
      },
    },
  });

  return gamifications.map((g, index) => ({
    rank: index + 1,
    userId: g.userId,
    userName: g.user.name || "Usuario",
    userImage: g.user.image,
    points: g.points,
    level: getLevelFromPoints(g.points),
    medalCount: g._count.medals,
  }));
}

/**
 * Record a Big Rock creation and award points
 */
export async function recordBigRockCreated(userId: string): Promise<{
  points: number;
  newMedal?: { type: MedalType; level: MedalLevel };
}> {
  // Award points
  const pointResult = await awardPoints(userId, "CREATE_BIG_ROCK");

  // Increment counter
  const counterResult = await incrementCounter(userId, "bigRocksCreated");

  return {
    points: pointResult.points,
    newMedal: counterResult.newMedal,
  };
}

/**
 * Record a TAR completion and award points
 */
export async function recordTARCompleted(userId: string): Promise<{
  points: number;
  newMedal?: { type: MedalType; level: MedalLevel };
}> {
  // Award points
  const pointResult = await awardPoints(userId, "COMPLETE_TAR");

  // Increment counter
  const counterResult = await incrementCounter(userId, "tarsCompleted");

  return {
    points: pointResult.points,
    newMedal: counterResult.newMedal,
  };
}

/**
 * Record a weekly review and award points
 */
export async function recordWeeklyReview(userId: string): Promise<{
  points: number;
  newMedal?: { type: MedalType; level: MedalLevel };
}> {
  // Award points
  const pointResult = await awardPoints(userId, "WEEKLY_REVIEW");

  // Increment counter
  const counterResult = await incrementCounter(userId, "weeklyReviews");

  return {
    points: pointResult.points,
    newMedal: counterResult.newMedal,
  };
}

/**
 * Record daily activity log and update streak
 */
export async function recordDailyLog(userId: string): Promise<{
  points: number;
  streakBonus?: number;
  newMedal?: { type: MedalType; level: MedalLevel };
  currentStreak: number;
}> {
  // Award points
  const pointResult = await awardPoints(userId, "DAILY_LOG");

  // Increment daily log counter
  await incrementCounter(userId, "dailyLogs");

  // Update streak
  const streakResult = await updateStreak(userId, true);

  return {
    points: pointResult.points,
    streakBonus: streakResult.streakBonus,
    newMedal: streakResult.newMedal,
    currentStreak: streakResult.currentStreak,
  };
}
