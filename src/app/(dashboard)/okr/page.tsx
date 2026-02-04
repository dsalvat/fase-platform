import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Target, Users, Calendar, Plus, TrendingUp } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function OKRDashboardPage() {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("okr");
  const tTeams = await getTranslations("teams");

  // Get user role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get current quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

  // Get active quarter for the company
  const activeQuarter = companyId
    ? await prisma.oKRQuarter.findFirst({
        where: {
          companyId,
          isActive: true,
        },
        orderBy: { startDate: "desc" },
      })
    : null;

  // Get teams - admins see all company teams, others see only their teams
  let userTeams: { team: { id: string; name: string; description: string | null; _count: { objectives: number; members: number } } }[];

  if (isAdmin && companyId) {
    // Admins see all company teams
    const allTeams = await prisma.team.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { objectives: true, members: true },
        },
      },
    });
    userTeams = allTeams.map(team => ({ team }));
  } else {
    // Regular users see only teams where they are members
    userTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            _count: {
              select: { objectives: true, members: true },
            },
          },
        },
      },
    });
  }

  // Get objectives for user's teams in active quarter
  const objectives = activeQuarter
    ? await prisma.oKRObjective.findMany({
        where: {
          quarterId: activeQuarter.id,
          OR: [
            { ownerId: user.id },
            { team: { members: { some: { userId: user.id } } } },
          ],
        },
        include: {
          team: true,
          owner: { select: { id: true, name: true, image: true } },
          keyResults: {
            include: {
              responsible: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Calculate stats
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(
    (o) => o.status === "COMPLETED"
  ).length;
  const avgProgress =
    totalObjectives > 0
      ? Math.round(
          objectives.reduce((sum, o) => sum + o.progress, 0) / totalObjectives
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard")}</h1>
          <p className="text-muted-foreground">
            {activeQuarter
              ? `Q${currentQuarter} ${currentYear}`
              : "Sin trimestre activo"}
          </p>
        </div>
        <Link href="/okr/objetivos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newObjective")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalObjectives}</p>
                <p className="text-sm text-muted-foreground">
                  {t("objectives")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgProgress}%</p>
                <p className="text-sm text-muted-foreground">{t("progress")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userTeams.length}</p>
                <p className="text-sm text-muted-foreground">
                  {tTeams("title")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {completedObjectives}/{totalObjectives}
                </p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No active quarter warning */}
      {!activeQuarter && companyId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">
                  No hay trimestre activo
                </h3>
                <p className="text-sm text-amber-700">
                  Activa un trimestre para comenzar a crear objetivos OKR.
                </p>
                <Link href="/okr/trimestres">
                  <Button variant="outline" size="sm" className="mt-2">
                    Gestionar Trimestres
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("myObjectives")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {objectives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noObjectives")}</p>
              <Link href="/okr/objetivos/nuevo">
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("newObjective")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {objectives.map((objective) => (
                <Link
                  key={objective.id}
                  href={`/okr/objetivos/${objective.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{objective.team.name}</Badge>
                          <Badge
                            variant={
                              objective.status === "COMPLETED"
                                ? "default"
                                : objective.status === "ACTIVE"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {objective.status === "DRAFT"
                              ? t("statusDraft")
                              : objective.status === "ACTIVE"
                              ? t("statusActive")
                              : objective.status === "COMPLETED"
                              ? t("statusCompleted")
                              : t("statusCancelled")}
                          </Badge>
                        </div>
                        <h3 className="font-medium truncate">
                          {objective.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {objective.keyResults.length} {t("keyResults")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            objective.progress >= 70
                              ? "text-green-600"
                              : objective.progress >= 30
                              ? "text-amber-600"
                              : "text-gray-400"
                          }`}
                        >
                          {Math.round(objective.progress)}%
                        </p>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              objective.progress >= 70
                                ? "bg-green-500"
                                : objective.progress >= 30
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                            style={{ width: `${objective.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Teams */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {tTeams("title")}
            </CardTitle>
            <Link href="/okr/equipos/nuevo">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {tTeams("new")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {userTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tTeams("noTeams")}</p>
              <Link href="/okr/equipos/nuevo">
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {tTeams("new")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTeams.map(({ team }) => (
                <Link
                  key={team.id}
                  href={`/okr/equipos/${team.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <h3 className="font-medium">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{team._count.members} miembros</span>
                      <span>{team._count.objectives} objetivos</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
