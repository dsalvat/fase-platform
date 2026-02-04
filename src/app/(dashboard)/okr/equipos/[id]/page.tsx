import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Users, Target, Settings, UserPlus } from "lucide-react";
import { UserRole } from "@prisma/client";
import { TeamMemberList } from "./team-member-list";
import { AddMemberDialog } from "./add-member-dialog";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const t = await getTranslations("teams");
  const tOkr = await getTranslations("okr");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get team with members and objectives
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      objectives: {
        include: {
          owner: { select: { id: true, name: true } },
          keyResults: true,
        },
        orderBy: { createdAt: "desc" },
      },
      company: {
        select: { id: true },
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Get available users to add (users in the same company not already in team)
  const availableUsers = isAdmin
    ? await prisma.user.findMany({
        where: {
          companies: {
            some: { companyId: team.company.id },
          },
          NOT: {
            teamMemberships: {
              some: { teamId: id },
            },
          },
        },
        select: { id: true, name: true, email: true, image: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/okr/equipos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground">{team.description}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <Link href={`/okr/equipos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("members")} ({team.members.length})
            </CardTitle>
            {isAdmin && availableUsers.length > 0 && (
              <AddMemberDialog teamId={id} availableUsers={availableUsers} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay miembros en este equipo</p>
              {isAdmin && availableUsers.length > 0 && (
                <p className="text-sm mt-2">Añade miembros usando el botón de arriba</p>
              )}
            </div>
          ) : (
            <TeamMemberList
              teamId={id}
              members={team.members}
              isAdmin={isAdmin}
            />
          )}
        </CardContent>
      </Card>

      {/* Team Objectives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {tOkr("objectives")} ({team.objectives.length})
            </CardTitle>
            <Link href={`/okr/objetivos/nuevo?teamId=${id}`}>
              <Button size="sm">
                <Target className="h-4 w-4 mr-2" />
                {tOkr("newObjective")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {team.objectives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tOkr("noObjectives")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {team.objectives.map((objective) => (
                <Link
                  key={objective.id}
                  href={`/okr/objetivos/${objective.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
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
                              ? tOkr("statusDraft")
                              : objective.status === "ACTIVE"
                              ? tOkr("statusActive")
                              : objective.status === "COMPLETED"
                              ? tOkr("statusCompleted")
                              : tOkr("statusCancelled")}
                          </Badge>
                        </div>
                        <h3 className="font-medium">{objective.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {objective.keyResults.length} {tOkr("keyResults")} · Owner: {objective.owner.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            objective.progress >= 70
                              ? "text-green-600"
                              : objective.progress >= 30
                              ? "text-amber-600"
                              : "text-gray-400"
                          }`}
                        >
                          {Math.round(objective.progress)}%
                        </p>
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
