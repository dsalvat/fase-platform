import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, Target, CheckCircle2, Activity, ArrowLeft } from "lucide-react";

export default async function OKRGamificationPage() {
  const user = await requireAuth();
  const t = await getTranslations("okr");
  const tGamification = await getTranslations("gamification");

  // Get or create OKR gamification for user
  let gamification = await prisma.oKRGamification.findUnique({
    where: { userId: user.id },
  });

  if (!gamification) {
    gamification = await prisma.oKRGamification.create({
      data: {
        userId: user.id,
        points: 0,
        objectivesCreated: 0,
        keyResultsCompleted: 0,
        activitiesCompleted: 0,
      },
    });
  }

  // Calculate level based on points
  const level = Math.floor(gamification.points / 500) + 1;
  const pointsForNextLevel = level * 500;
  const pointsProgress =
    ((gamification.points % 500) / 500) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/okr">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("gamification")}
          </h1>
          <p className="text-muted-foreground">
            Tu progreso y logros en OKRs
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gamification.points}</p>
                <p className="text-sm text-muted-foreground">
                  {tGamification("points")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {gamification.objectivesCreated}
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
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {gamification.keyResultsCompleted}
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {gamification.activitiesCompleted}
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
            {tGamification("level")} {level}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{gamification.points} puntos</span>
              <span>{pointsForNextLevel} puntos para nivel {level + 1}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                style={{ width: `${pointsProgress}%` }}
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
    </div>
  );
}
