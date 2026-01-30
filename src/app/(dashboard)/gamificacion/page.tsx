import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getLevelProgress, getPointsForNextLevel, MEDAL_CONFIG, MEDAL_LEVEL_CONFIG } from "@/types/gamification";
import {
  PointsCard,
  StreakCard,
  StatsCard,
  MedalsDisplay,
  MedalsProgress,
  Leaderboard,
} from "@/components/gamification";
import { MedalType, MedalLevel } from "@prisma/client";

async function getGamificationData(userId: string) {
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
    include: {
      medals: {
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  return gamification;
}

async function getLeaderboardData(limit: number = 10) {
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
    userImage: g.user.image || undefined,
    points: g.points,
    level: getLevelFromPoints(g.points),
    medalCount: g._count.medals,
  }));
}

function getLevelFromPoints(points: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

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

    for (const level of levels) {
      const threshold = MEDAL_CONFIG[type].thresholds[level];
      if (!earnedLevels.has(level)) {
        return { level, threshold };
      }
    }

    return null;
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

export default async function GamificacionPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const t = await getTranslations("gamification");

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("loginRequired")}</p>
      </div>
    );
  }

  const [gamification, leaderboard] = await Promise.all([
    getGamificationData(userId),
    getLeaderboardData(10),
  ]);

  // Default values for new users
  const points = gamification?.points || 0;
  const level = getLevelFromPoints(points);
  const levelProgress = getLevelProgress(points);
  const pointsToNextLevel = getPointsForNextLevel(level);
  const currentStreak = gamification?.currentStreak || 0;
  const longestStreak = gamification?.longestStreak || 0;

  const stats = {
    bigRocksCreated: gamification?.bigRocksCreated || 0,
    tarsCompleted: gamification?.tarsCompleted || 0,
    weeklyReviews: gamification?.weeklyReviews || 0,
    dailyLogs: gamification?.dailyLogs || 0,
  };

  const medals = gamification?.medals.map((m) => ({
    type: m.type,
    level: m.level,
    earnedAt: m.earnedAt,
    config: {
      label: MEDAL_CONFIG[m.type].label,
      description: MEDAL_CONFIG[m.type].description,
      levelConfig: MEDAL_LEVEL_CONFIG[m.level],
    },
  })) || [];

  const medalProgress = gamification
    ? calculateMedalProgress(gamification)
    : {
        CONSTANCIA: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 7, percentage: 0 },
        CLARIDAD: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 5, percentage: 0 },
        EJECUCION: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 10, percentage: 0 },
        MEJORA_CONTINUA: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 10, percentage: 0 },
      };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Main stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <PointsCard
          points={points}
          level={level}
          levelProgress={levelProgress}
          pointsToNextLevel={
            pointsToNextLevel === Infinity ? null : pointsToNextLevel - points
          }
        />
        <StreakCard
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />
      </div>

      {/* Stats and medals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatsCard stats={stats} />
        <MedalsProgress progress={medalProgress} />
      </div>

      {/* Earned medals */}
      <MedalsDisplay medals={medals} />

      {/* Leaderboard */}
      <Leaderboard entries={leaderboard} currentUserId={userId} />
    </div>
  );
}
