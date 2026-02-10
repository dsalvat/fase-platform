import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentMonth, formatMonthLabel, getCurrentWeek } from "@/lib/month-helpers";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BigRockCard } from "@/components/big-rocks/big-rock-card";
import { MonthProgressSummary } from "@/components/home/month-progress-summary";
import { ActiveTarsPanel } from "@/components/home/active-tars-panel";
import {
  Target,
  Plus,
  Users,
  UsersRound,
  User,
  Eye,
  CheckCircle,
  Clock,
  ArrowRight,
  Lock,
  ClipboardCheck,
} from "lucide-react";

async function getUserBigRocks(userId: string, month: string) {
  return prisma.bigRock.findMany({
    where: {
      userId,
      month,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      tars: {
        select: {
          id: true,
          description: true,
          status: true,
          progress: true,
        },
      },
      keyMeetings: true,
      _count: {
        select: {
          keyMeetings: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getSuperviseesWithBigRocks(supervisorId: string, month: string, companyId: string | null) {
  if (!companyId) return [];

  // Get only direct supervisees in the current company (per-company supervisor relationship)
  const superviseeUcs = await prisma.userCompany.findMany({
    where: { supervisorId, companyId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bigRocks: {
            where: { month },
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return superviseeUcs.map((uc) => uc.user);
}

async function getAllUsersWithBigRocks(currentUserId: string, month: string) {
  // Get current user's companies
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { companies: { select: { companyId: true } } },
  });

  const companyIds = currentUser?.companies.map(c => c.companyId) || [];

  // Get all users from the same company (excluding current user)
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      companies: companyIds.length > 0 ? { some: { companyId: { in: companyIds } } } : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bigRocks: {
        where: { month },
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return allUsers;
}

async function isMonthPlanningConfirmed(userId: string, month: string): Promise<boolean> {
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId,
      month,
    },
    select: {
      isPlanningConfirmed: true,
    },
  });

  return openMonth?.isPlanningConfirmed ?? false;
}

export default async function HomePage() {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  const currentMonth = getCurrentMonth();
  const t = await getTranslations("home");
  const tBigRocks = await getTranslations("bigRocks");

  // Check permissions
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;
  const isSupervisor = userRole === UserRole.SUPERVISOR || isAdmin;

  // Get user's Big Rocks
  const myBigRocks = await getUserBigRocks(user.id, currentMonth);

  // Get direct supervisees (for supervisors and admins) - per-company
  const companyId = user.currentCompanyId;
  let supervisees: Awaited<ReturnType<typeof getSuperviseesWithBigRocks>> = [];
  if (isSupervisor) {
    supervisees = await getSuperviseesWithBigRocks(user.id, currentMonth, companyId);
  }

  // Get all company users (only for admins)
  let allUsers: Awaited<ReturnType<typeof getAllUsersWithBigRocks>> = [];
  if (isAdmin) {
    allUsers = await getAllUsersWithBigRocks(user.id, currentMonth);
  }

  // Check if weekly review reminder should show (Fri/Sat/Sun)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const isReviewDay = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  let showReviewReminder = false;
  if (isReviewDay && companyId) {
    const currentWeek = getCurrentWeek();
    const existingReview = await prisma.weeklyReview.findUnique({
      where: {
        userId_week_companyId: {
          userId: user.id,
          week: currentWeek,
          companyId,
        },
      },
      select: { id: true },
    });
    showReviewReminder = !existingReview;
  }

  // Check if the month planning is confirmed
  const planningConfirmed = await isMonthPlanningConfirmed(user.id, currentMonth);

  // Compute month progress data
  const allTars = myBigRocks.flatMap((br) =>
    br.tars.map((tar) => ({
      ...tar,
      bigRockId: br.id,
      bigRockTitle: br.title,
    }))
  );
  const allMeetings = myBigRocks.flatMap((br) => br.keyMeetings);
  const tarsTotal = allTars.length;
  const tarsCompleted = allTars.filter((t) => t.status === "COMPLETADA").length;
  const avgProgress =
    tarsTotal > 0
      ? allTars.reduce((sum, t) => sum + (t.progress || 0), 0) / tarsTotal
      : 0;
  const pendingTars = allTars
    .filter((t) => (t.progress || 0) < 100)
    .sort((a, b) => (a.progress || 0) - (b.progress || 0))
    .map((t) => ({
      id: t.id,
      description: t.description,
      progress: t.progress || 0,
      bigRockId: t.bigRockId,
      bigRockTitle: t.bigRockTitle,
    }));

  const progressData = {
    bigRocksTotal: myBigRocks.length,
    bigRocksConfirmed: myBigRocks.filter((br) => br.status !== "CREADO").length,
    tarsTotal,
    tarsCompleted,
    avgProgress,
    meetingsTotal: allMeetings.length,
    meetingsCompleted: allMeetings.filter((m) => m.completed).length,
    pendingTars,
  };

  const tProgress = await getTranslations("home.progress");
  const tActiveTars = await getTranslations("home.activeTars");
  const tReview = await getTranslations("weeklyReview");

  // Active TARs (not completed, with some progress or pending)
  const activeTars = allTars
    .filter((t) => t.status !== "COMPLETADA")
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .map((t) => ({
      id: t.id,
      description: t.description,
      progress: t.progress || 0,
      status: t.status,
      bigRockId: t.bigRockId,
      bigRockTitle: t.bigRockTitle,
    }));

  return (
    <div className="space-y-8">
      {/* Month Progress Summary */}
      {myBigRocks.length > 0 && (
        <MonthProgressSummary
          data={progressData}
          translations={{
            overallProgress: tProgress("overallProgress"),
            bigRocks: tProgress("bigRocks"),
            tars: tProgress("tars"),
            meetings: tProgress("meetings"),
            confirmed: tProgress("confirmed"),
            completed: tProgress("completed"),
            pendingTars: tProgress("pendingTars"),
            viewAll: tProgress("viewAll"),
            noPendingTars: tProgress("noPendingTars"),
          }}
        />
      )}

      {/* Active TARs Panel */}
      {activeTars.length > 0 && (
        <ActiveTarsPanel
          tars={activeTars}
          translations={{
            title: tActiveTars("title"),
            markComplete: tActiveTars("markComplete"),
            noActiveTars: tActiveTars("noActiveTars"),
            collapse: tActiveTars("collapse"),
            expand: tActiveTars("expand"),
          }}
        />
      )}

      {/* Weekly Review Reminder Banner */}
      {showReviewReminder && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium text-sm">{tReview("reminderTitle")}</p>
                <p className="text-xs text-muted-foreground">{tReview("reminderDescription")}</p>
              </div>
            </div>
            <Link href="/revision-semanal">
              <Button size="sm" variant="outline" className="shrink-0">
                {tReview("reminderButton")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* My Big Rocks Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Target className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{t("myBigRocks")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{formatMonthLabel(currentMonth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {planningConfirmed ? (
              <Badge variant="outline" className="text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{t("confirmed")}</span>
              </Badge>
            ) : (
              <Link href={`/big-rocks/new?month=${currentMonth}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{tBigRocks("new")}</span>
                </Button>
              </Link>
            )}
            <Link href="/big-rocks">
              <Button variant="outline" size="sm">
                <span className="hidden sm:inline">{t("viewAll")}</span>
                <ArrowRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {myBigRocks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{t("noBigRocks")}</p>
                <p className="text-sm mt-1">{t("noBigRocksDescription")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myBigRocks.map((bigRock) => (
              <BigRockCard
                key={bigRock.id}
                bigRock={bigRock}
                isReadOnly={false}
                canEdit={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Supervisees Section */}
      {isSupervisor && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg shrink-0">
                <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{t("superviseesBigRocks")}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{formatMonthLabel(currentMonth)}</p>
              </div>
            </div>
            <Link href="/supervisor">
              <Button variant="outline" size="sm">
                <span className="hidden sm:inline">{t("viewAll")}</span>
                <ArrowRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </Link>
          </div>

          {supervisees.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t("noSupervisees")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supervisees.map((supervisee) => {
                // A Big Rock is "confirmed" if status is not CREADO
                const confirmedCount = supervisee.bigRocks.filter(b => b.status !== "CREADO").length;
                const totalCount = supervisee.bigRocks.length;
                const allConfirmed = totalCount > 0 && confirmedCount === totalCount;

                return (
                  <Card key={supervisee.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {supervisee.image ? (
                          <img
                            src={supervisee.image}
                            alt={supervisee.name || ""}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {supervisee.name || supervisee.email}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{supervisee.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          className={allConfirmed
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }
                        >
                          {allConfirmed ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">{t("confirmed")}</span></>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">{t("inProgress")}</span></>
                          )}
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {confirmedCount}/{totalCount} <span className="hidden sm:inline">Big Rocks</span>
                        </span>
                      </div>

                      {/* Big Rocks summary */}
                      {supervisee.bigRocks.length > 0 ? (
                        <ul className="space-y-1">
                          {supervisee.bigRocks.slice(0, 3).map((br) => (
                            <li key={br.id} className="flex items-center gap-2 text-sm">
                              {br.status !== "CREADO" ? (
                                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                              )}
                              <span className="text-foreground/80">{br.title}</span>
                            </li>
                          ))}
                          {supervisee.bigRocks.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{supervisee.bigRocks.length - 3} {t("more")}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{t("noBigRocksYet")}</p>
                      )}

                      {/* View button */}
                      <Link href={`/supervisor/${supervisee.id}/${currentMonth}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          {t("viewDetails")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* All Users Section - Only for Admins */}
      {isAdmin && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                <UsersRound className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{t("allUsersBigRocks")}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{formatMonthLabel(currentMonth)}</p>
              </div>
            </div>
            <Link href="/admin/usuarios">
              <Button variant="outline" size="sm">
                <span className="hidden sm:inline">{t("viewAll")}</span>
                <ArrowRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </Link>
          </div>

          {allUsers.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <UsersRound className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t("noUsers")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allUsers.map((userItem) => {
                // A Big Rock is "confirmed" if status is not CREADO
                const confirmedCount = userItem.bigRocks.filter(b => b.status !== "CREADO").length;
                const totalCount = userItem.bigRocks.length;
                const allConfirmed = totalCount > 0 && confirmedCount === totalCount;

                return (
                  <Card key={userItem.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {userItem.image ? (
                          <img
                            src={userItem.image}
                            alt={userItem.name || ""}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {userItem.name || userItem.email}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <Badge
                          className={allConfirmed
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }
                        >
                          {allConfirmed ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> {t("confirmed")}</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {t("inProgress")}</>
                          )}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {confirmedCount}/{totalCount} Big Rocks
                        </span>
                      </div>

                      {/* Big Rocks summary */}
                      {userItem.bigRocks.length > 0 ? (
                        <ul className="space-y-1">
                          {userItem.bigRocks.slice(0, 3).map((br) => (
                            <li key={br.id} className="flex items-center gap-2 text-sm">
                              {br.status !== "CREADO" ? (
                                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                              )}
                              <span className="text-foreground/80">{br.title}</span>
                            </li>
                          ))}
                          {userItem.bigRocks.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{userItem.bigRocks.length - 3} {t("more")}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{t("noBigRocksYet")}</p>
                      )}

                      {/* View button */}
                      <Link href={`/supervisor/${userItem.id}/${currentMonth}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          {t("viewDetails")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
