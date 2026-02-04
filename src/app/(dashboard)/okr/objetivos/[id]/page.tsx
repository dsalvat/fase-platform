import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Target, BarChart3, Settings } from "lucide-react";
import { UserRole, TeamMemberRole } from "@prisma/client";
import { KeyResultsList } from "./key-results-list";
import { AddKeyResultDialog } from "./add-key-result-dialog";
import { ObjectiveStatusBadge } from "./objective-status-badge";

interface ObjectiveDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ObjectiveDetailPage({ params }: ObjectiveDetailPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const t = await getTranslations("okr");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get objective with key results
  const objective = await prisma.oKRObjective.findUnique({
    where: { id },
    include: {
      team: true,
      owner: { select: { id: true, name: true, email: true, image: true } },
      quarter: true,
      keyResults: {
        include: {
          responsible: { select: { id: true, name: true, image: true } },
          activities: {
            include: {
              assignee: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!objective) {
    notFound();
  }

  // Get team members for key result assignment and permission check
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: objective.teamId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Check user's role in the team
  const userTeamMember = teamMembers.find((tm) => tm.user.id === user.id);
  const userTeamRole = userTeamMember?.role ?? null;

  // Permission calculations based on team role
  const canEdit = isAdmin ||
    userTeamRole === TeamMemberRole.RESPONSABLE ||
    userTeamRole === TeamMemberRole.EDITOR;
  const canDelete = isAdmin || userTeamRole === TeamMemberRole.RESPONSABLE;
  const canAddKeyResults = isAdmin ||
    userTeamRole === TeamMemberRole.RESPONSABLE ||
    userTeamRole === TeamMemberRole.EDITOR;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/okr/objetivos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline">{objective.team.name}</Badge>
              <ObjectiveStatusBadge
                objectiveId={objective.id}
                status={objective.status}
                canEdit={canEdit}
              />
              {userTeamRole && (
                <Badge
                  variant="outline"
                  className={
                    userTeamRole === TeamMemberRole.RESPONSABLE
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : userTeamRole === TeamMemberRole.EDITOR
                      ? "bg-green-100 text-green-800 border-green-200"
                      : userTeamRole === TeamMemberRole.DIRECTOR
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-muted text-muted-foreground border-muted"
                  }
                >
                  Tu rol: {userTeamRole === TeamMemberRole.RESPONSABLE
                    ? "Responsable"
                    : userTeamRole === TeamMemberRole.EDITOR
                    ? "Editor"
                    : userTeamRole === TeamMemberRole.DIRECTOR
                    ? "Director"
                    : "Visualizador"}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{objective.title}</h1>
            <p className="text-muted-foreground">
              Q{objective.quarter.quarter.replace("Q", "")} {objective.quarter.year}
            </p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/okr/objetivos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso General</span>
                <span
                  className={`text-2xl font-bold ${
                    objective.progress >= 70
                      ? "text-green-600"
                      : objective.progress >= 30
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {Math.round(objective.progress)}%
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    objective.progress >= 70
                      ? "bg-green-500"
                      : objective.progress >= 30
                      ? "bg-amber-500"
                      : "bg-muted-foreground"
                  }`}
                  style={{ width: `${Math.min(100, objective.progress)}%` }}
                />
              </div>
            </div>
            <div className="text-center px-4 border-l">
              <p className="text-3xl font-bold text-blue-600">
                {objective.keyResults.length}
              </p>
              <p className="text-sm text-muted-foreground">{t("keyResults")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objective Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detalles del Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {objective.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Descripción
              </p>
              <p className="text-foreground">{objective.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Indicador de Éxito
            </p>
            <p className="text-foreground">{objective.indicator}</p>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {objective.owner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={objective.owner.image}
                      alt={objective.owner.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">
                      {objective.owner.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span>{objective.owner.name}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Equipo</p>
              <span>{objective.team.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("keyResults")} ({objective.keyResults.length})
            </CardTitle>
            {canAddKeyResults && (
              <AddKeyResultDialog
                objectiveId={objective.id}
                teamMembers={teamMembers.map((tm) => tm.user)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {objective.keyResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay Key Results definidos</p>
              <p className="text-sm mt-2">
                Añade Key Results para medir el progreso del objetivo
              </p>
            </div>
          ) : (
            <KeyResultsList
              keyResults={objective.keyResults}
              canEdit={canEdit}
              teamMembers={teamMembers.map((tm) => tm.user)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
