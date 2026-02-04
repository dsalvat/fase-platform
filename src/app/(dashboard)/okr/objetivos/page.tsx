import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Target, Plus, ArrowLeft } from "lucide-react";

export default async function ObjectivesPage() {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("okr");

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

  // Get all objectives for user's teams in active quarter
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
          keyResults: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/okr">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("objectives")}
            </h1>
            <p className="text-muted-foreground">
              {activeQuarter
                ? `${activeQuarter.quarter} ${activeQuarter.year}`
                : "Sin trimestre activo"}
            </p>
          </div>
        </div>
        <Link href="/okr/objetivos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newObjective")}
          </Button>
        </Link>
      </div>

      {/* Objectives List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("myObjectives")}</CardTitle>
        </CardHeader>
        <CardContent>
          {objectives.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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
                        <h3 className="font-medium">{objective.title}</h3>
                        {objective.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {objective.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
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
    </div>
  );
}
