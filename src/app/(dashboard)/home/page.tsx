import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentMonth, formatMonthLabel } from "@/lib/month-helpers";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BigRockCard } from "@/components/big-rocks/big-rock-card";
import {
  Target,
  Plus,
  Users,
  User,
  Eye,
  CheckCircle,
  Clock,
  ArrowRight,
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
          status: true,
        },
      },
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

async function getSuperviseesWithBigRocks(supervisorId: string, month: string, userRole: UserRole) {
  // Get supervisees based on role
  let supervisees;

  if (userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN) {
    // Admins see users from the same company
    const currentUser = await prisma.user.findUnique({
      where: { id: supervisorId },
      include: { companies: { select: { companyId: true } } },
    });

    const companyIds = currentUser?.companies.map(c => c.companyId) || [];

    supervisees = await prisma.user.findMany({
      where: {
        id: { not: supervisorId },
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
  } else {
    // Supervisors see only their direct supervisees
    supervisees = await prisma.user.findMany({
      where: {
        supervisorId,
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
  }

  return supervisees;
}

export default async function HomePage() {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  const currentMonth = getCurrentMonth();
  const t = await getTranslations("home");
  const tBigRocks = await getTranslations("bigRocks");

  // Check if user can view supervisees
  const isSupervisor = userRole === UserRole.SUPERVISOR || userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get user's Big Rocks
  const myBigRocks = await getUserBigRocks(user.id, currentMonth);

  // Get supervisees if applicable
  let supervisees: Awaited<ReturnType<typeof getSuperviseesWithBigRocks>> = [];
  if (isSupervisor) {
    supervisees = await getSuperviseesWithBigRocks(user.id, currentMonth, userRole);
  }

  return (
    <div className="space-y-8">
      {/* My Big Rocks Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t("myBigRocks")}</h2>
              <p className="text-sm text-gray-500">{formatMonthLabel(currentMonth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/big-rocks/new?month=${currentMonth}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {tBigRocks("new")}
              </Button>
            </Link>
            <Link href="/big-rocks">
              <Button variant="outline" size="sm">
                {t("viewAll")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {myBigRocks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t("superviseesBigRocks")}</h2>
                <p className="text-sm text-gray-500">{formatMonthLabel(currentMonth)}</p>
              </div>
            </div>
            <Link href="/supervisor">
              <Button variant="outline" size="sm">
                {t("viewAll")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {supervisees.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
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
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {supervisee.name || supervisee.email}
                          </CardTitle>
                          <p className="text-xs text-gray-500 truncate">{supervisee.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <Badge
                          className={allConfirmed
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {allConfirmed ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> {t("confirmed")}</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {t("inProgress")}</>
                          )}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {confirmedCount}/{totalCount} Big Rocks
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
                              <span className="truncate text-gray-600">{br.title}</span>
                            </li>
                          ))}
                          {supervisee.bigRocks.length > 3 && (
                            <li className="text-xs text-gray-400">
                              +{supervisee.bigRocks.length - 3} {t("more")}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">{t("noBigRocksYet")}</p>
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
    </div>
  );
}
