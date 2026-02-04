import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { getSuperviseesWithPlanningStatus } from "@/app/actions/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthSelector } from "@/components/big-rocks/month-selector";
import { getNextMonth, getCurrentMonth } from "@/lib/month-helpers";
import { UserRole } from "@prisma/client";
import { Users, Eye, Clock, CheckCircle, User } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function SupervisorPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  // Only supervisors and admins can access
  if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    redirect("/big-rocks");
  }

  const { month } = await searchParams;
  const defaultMonth = getNextMonth(getCurrentMonth());
  const displayMonth = month || defaultMonth;

  const t = await getTranslations("supervisor");

  // Get supervisees with their planning status
  const supervisees = await getSuperviseesWithPlanningStatus(displayMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("supervisees")}</p>
        </div>
      </div>

      {/* Month selector */}
      <MonthSelector defaultMonth={defaultMonth} />

      {/* Supervisees list */}
      {supervisees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("noSupervisees")}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supervisees.map((supervisee) => {
            const { planningStatus } = supervisee;
            const canView = planningStatus.isPlanningConfirmed;

            return (
              <Card key={supervisee.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
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
                      <div>
                        <CardTitle className="text-base">
                          {supervisee.name || supervisee.email}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{supervisee.email}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Planning status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {canView ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("planningReady")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {t("planningNotReady")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {planningStatus.confirmedBigRocks}/{planningStatus.totalBigRocks} Big Rocks
                    </span>
                  </div>

                  {/* Progress bar */}
                  {planningStatus.totalBigRocks > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          canView ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${
                            (planningStatus.confirmedBigRocks /
                              planningStatus.totalBigRocks) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Action button */}
                  {canView ? (
                    <Link href={`/supervisor/${supervisee.id}/${displayMonth}`}>
                      <Button size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        {t("viewPlanning")}
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">
                        {t("awaitingConfirmation")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
