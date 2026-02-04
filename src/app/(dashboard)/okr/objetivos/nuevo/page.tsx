import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Target, AlertCircle } from "lucide-react";
import { NewObjectiveForm } from "./new-objective-form";

interface NewObjectivePageProps {
  searchParams: Promise<{ teamId?: string }>;
}

export default async function NewObjectivePage({ searchParams }: NewObjectivePageProps) {
  const { teamId: preselectedTeamId } = await searchParams;
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("okr");

  if (!companyId) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">
                  No hay empresa seleccionada
                </h3>
                <p className="text-sm text-amber-700">
                  Selecciona una empresa para crear objetivos OKR.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get active quarter for the company
  const activeQuarter = await prisma.oKRQuarter.findFirst({
    where: {
      companyId,
      isActive: true,
    },
  });

  if (!activeQuarter) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/okr/objetivos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("newObjective")}</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">
                  No hay trimestre activo
                </h3>
                <p className="text-sm text-amber-700">
                  Activa un trimestre antes de crear objetivos OKR.
                </p>
                <Link href="/okr/trimestres/activar">
                  <Button variant="outline" size="sm" className="mt-2">
                    Activar Trimestre
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user's teams
  const userTeams = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: true,
    },
  });

  // Also get all company teams if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPERADMIN";

  let availableTeams = userTeams.map((tm) => tm.team);

  if (isAdmin) {
    const allCompanyTeams = await prisma.team.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
    availableTeams = allCompanyTeams;
  }

  if (availableTeams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/okr/objetivos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("newObjective")}</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">
                  No perteneces a ningún equipo
                </h3>
                <p className="text-sm text-amber-700">
                  Necesitas ser miembro de un equipo para crear objetivos OKR.
                </p>
                <Link href="/okr/equipos">
                  <Button variant="outline" size="sm" className="mt-2">
                    Ver Equipos
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/okr/objetivos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("newObjective")}</h1>
          <p className="text-muted-foreground">
            Q{activeQuarter.quarter.replace("Q", "")} {activeQuarter.year}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Definir Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewObjectiveForm
            teams={availableTeams}
            quarterId={activeQuarter.id}
            preselectedTeamId={preselectedTeamId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
