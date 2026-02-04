import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function QuartersPage() {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("okr");
  const tQuarter = await getTranslations("quarterPeriod");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get quarters for the company
  const quarters = companyId
    ? await prisma.oKRQuarter.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { objectives: true },
          },
        },
        orderBy: [{ year: "desc" }, { quarter: "desc" }],
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
            <h1 className="text-2xl font-bold text-gray-900">{t("quarters")}</h1>
            <p className="text-muted-foreground">
              Gestiona los trimestres de OKR
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link href="/okr/trimestres/activar">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Activar Trimestre
            </Button>
          </Link>
        )}
      </div>

      {/* Quarters List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quarters")}</CardTitle>
        </CardHeader>
        <CardContent>
          {quarters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay trimestres configurados</p>
              <p className="text-sm mt-2">
                Activa un trimestre para comenzar a crear OKRs
              </p>
              {isAdmin && (
                <Link href="/okr/trimestres/activar">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Activar Trimestre
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quarters.map((quarter) => (
                <div
                  key={quarter.id}
                  className={`p-4 border rounded-lg ${
                    quarter.isActive ? "border-green-200 bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {tQuarter(quarter.quarter)} {quarter.year}
                          </h3>
                          {quarter.isActive && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(quarter.startDate), "d MMM", {
                            locale: es,
                          })}{" "}
                          -{" "}
                          {format(new Date(quarter.endDate), "d MMM yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {quarter._count.objectives}
                      </p>
                      <p className="text-sm text-muted-foreground">objetivos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
