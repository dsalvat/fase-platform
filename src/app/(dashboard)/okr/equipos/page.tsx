import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Plus, ArrowLeft } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function TeamsPage() {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("teams");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Get teams for the company
  const teams = companyId
    ? await prisma.team.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { members: true, objectives: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            take: 5,
          },
        },
        orderBy: { name: "asc" },
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
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {isAdmin && (
          <Link href="/okr/equipos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("new")}
            </Button>
          </Link>
        )}
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noTeams")}</p>
              <p className="text-sm mt-2">{t("createFirst")}</p>
              {isAdmin && (
                <Link href="/okr/equipos/nuevo">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("new")}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/okr/equipos/${team.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <h3 className="font-medium text-lg">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>
                        {team._count.members} {t("members")}
                      </span>
                      <span>{team._count.objectives} objetivos</span>
                    </div>
                    {team.members.length > 0 && (
                      <div className="flex -space-x-2 mt-3">
                        {team.members.map(({ user: member }) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium"
                            title={member.name || ""}
                          >
                            {member.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.image}
                                alt={member.name || ""}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              member.name?.charAt(0).toUpperCase() || "?"
                            )}
                          </div>
                        ))}
                        {team._count.members > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                            +{team._count.members - 5}
                          </div>
                        )}
                      </div>
                    )}
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
