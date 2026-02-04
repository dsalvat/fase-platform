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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedalType, MedalLevel, AppType } from "@prisma/client";
import { Trophy, Target, CheckCircle2, Activity, Rocket, BarChart3 } from "lucide-react";

// FASE Gamification Data
async function getFASEGamificationData(userId: string) {
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

async function getFASELeaderboardData(limit: number = 10) {
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

// OKR Gamification Data
async function getOKRGamificationData(userId: string) {
  let gamification = await prisma.oKRGamification.findUnique({
    where: { userId },
  });

  if (!gamification) {
    gamification = await prisma.oKRGamification.create({
      data: {
        userId,
        points: 0,
        objectivesCreated: 0,
        keyResultsCompleted: 0,
        activitiesCompleted: 0,
      },
    });
  }

  return gamification;
}

export default async function LogrosPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const t = await getTranslations("gamification");
  const tNav = await getTranslations("nav");

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("loginRequired")}</p>
      </div>
    );
  }

  // Get user's apps
  const userApps = await prisma.userApp.findMany({
    where: { userId },
    include: { app: true },
  });

  const hasFASE = userApps.some((ua) => ua.app.code === AppType.FASE);
  const hasOKR = userApps.some((ua) => ua.app.code === AppType.OKR);

  // Get gamification data based on user's apps
  const [faseGamification, faseLeaderboard, okrGamification] = await Promise.all([
    hasFASE ? getFASEGamificationData(userId) : null,
    hasFASE ? getFASELeaderboardData(10) : [],
    hasOKR ? getOKRGamificationData(userId) : null,
  ]);

  // FASE data calculations
  const fasePoints = faseGamification?.points || 0;
  const faseLevel = getLevelFromPoints(fasePoints);
  const faseLevelProgress = getLevelProgress(fasePoints);
  const fasePointsToNextLevel = getPointsForNextLevel(faseLevel);
  const currentStreak = faseGamification?.currentStreak || 0;
  const longestStreak = faseGamification?.longestStreak || 0;

  const faseStats = {
    bigRocksCreated: faseGamification?.bigRocksCreated || 0,
    tarsCompleted: faseGamification?.tarsCompleted || 0,
    weeklyReviews: faseGamification?.weeklyReviews || 0,
    dailyLogs: faseGamification?.dailyLogs || 0,
  };

  const faseMedals = faseGamification?.medals.map((m) => ({
    type: m.type,
    level: m.level,
    earnedAt: m.earnedAt,
    config: {
      label: MEDAL_CONFIG[m.type].label,
      description: MEDAL_CONFIG[m.type].description,
      levelConfig: MEDAL_LEVEL_CONFIG[m.level],
    },
  })) || [];

  const faseMedalProgress = faseGamification
    ? calculateMedalProgress(faseGamification)
    : {
        CONSTANCIA: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 7, percentage: 0 },
        CLARIDAD: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 5, percentage: 0 },
        EJECUCION: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 10, percentage: 0 },
        MEJORA_CONTINUA: { current: 0, nextLevel: "BRONCE" as MedalLevel, nextThreshold: 10, percentage: 0 },
      };

  // OKR data calculations
  const okrLevel = okrGamification ? Math.floor(okrGamification.points / 500) + 1 : 1;
  const okrPointsForNextLevel = okrLevel * 500;
  const okrPointsProgress = okrGamification
    ? ((okrGamification.points % 500) / 500) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{tNav("achievements")}</h1>
        <p className="text-muted-foreground mt-1">
          Tu progreso y logros en la plataforma
        </p>
      </div>

      {/* FASE Gamification Section */}
      {hasFASE && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">FASE</h2>
              <p className="text-sm text-muted-foreground">Metodologia de gestion de objetivos</p>
            </div>
          </div>

          {/* Main stats */}
          <div className="grid gap-6 md:grid-cols-2">
            <PointsCard
              points={fasePoints}
              level={faseLevel}
              levelProgress={faseLevelProgress}
              pointsToNextLevel={
                fasePointsToNextLevel === Infinity ? null : fasePointsToNextLevel - fasePoints
              }
            />
            <StreakCard
              currentStreak={currentStreak}
              longestStreak={longestStreak}
            />
          </div>

          {/* Stats and medals */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StatsCard stats={faseStats} />
            <MedalsProgress progress={faseMedalProgress} />
          </div>

          {/* Earned medals */}
          <MedalsDisplay medals={faseMedals} />

          {/* Leaderboard */}
          <Leaderboard entries={faseLeaderboard} currentUserId={userId} />
        </section>
      )}

      {/* OKR Gamification Section */}
      {hasOKR && okrGamification && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">OKRs</h2>
              <p className="text-sm text-muted-foreground">Objetivos y Resultados Clave</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{okrGamification.points}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("points")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {okrGamification.objectivesCreated}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Objetivos Creados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {okrGamification.keyResultsCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Key Results Completados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {okrGamification.activitiesCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Actividades Completadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                {t("level")} {okrLevel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>{okrGamification.points} puntos</span>
                  <span>{okrPointsForNextLevel} puntos para nivel {okrLevel + 1}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                    style={{ width: `${okrPointsProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points System */}
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Puntos OKR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Crear un Objetivo</span>
                  <span className="font-medium">+50 puntos</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Crear un Key Result</span>
                  <span className="font-medium">+25 puntos</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    Completar un Key Result
                  </span>
                  <span className="font-medium">+100 puntos</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    Completar una Actividad
                  </span>
                  <span className="font-medium">+10 puntos</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">
                    Alcanzar 100% en un Objetivo
                  </span>
                  <span className="font-medium">+200 puntos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* No apps message */}
      {!hasFASE && !hasOKR && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No tienes aplicaciones asignadas. Contacta al administrador para obtener acceso.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
