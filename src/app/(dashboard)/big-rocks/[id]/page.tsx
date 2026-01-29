import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { CategoryBadge } from "@/components/big-rocks/category-badge";
import { BigRockDeleteButton } from "@/components/big-rocks/big-rock-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, CheckCircle2, Circle, Clock } from "lucide-react";
import { isMonthReadOnly, formatMonthLabel } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusConfig = {
  PLANIFICADO: {
    label: "Planificado",
    icon: Circle,
    color: "text-gray-500",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    icon: Clock,
    color: "text-blue-500",
  },
  FINALIZADO: {
    label: "Finalizado",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

/**
 * Big Rock detail page
 * Server Component that fetches and displays full Big Rock details
 */
export default async function BigRockDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessBigRock(id, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Big Rock with full details
  const bigRock = await prisma.bigRock.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tars: {
        orderBy: { createdAt: "asc" },
      },
      keyMeetings: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!bigRock) {
    notFound();
  }

  const statusInfo = statusConfig[bigRock.status];
  const StatusIcon = statusInfo.icon;
  const isReadOnly = isMonthReadOnly(bigRock.month);
  const canEdit = bigRock.userId === user.id && !isReadOnly;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Link href={`/big-rocks?month=${bigRock.month}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Big Rocks
          </Button>
        </Link>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/big-rocks/${id}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <BigRockDeleteButton
              bigRockId={id}
              bigRockTitle={bigRock.title}
            />
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Este Big Rock es de un mes pasado y no puede ser editado.
          </p>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{bigRock.title}</CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <CategoryBadge category={bigRock.category} />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <StatusIcon className={statusInfo.color} />
                  <span>{statusInfo.label}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{bigRock.description}</p>
          </div>

          {/* Indicator */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Indicador de Éxito</h3>
            <p className="text-gray-700">{bigRock.indicator}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Mes</p>
              <p className="font-medium">{formatMonthLabel(bigRock.month)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TARs Planificadas</p>
              <p className="font-medium">{bigRock.numTars}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TARs Completadas</p>
              <p className="font-medium">
                {bigRock.tars.filter((t) => t.status === "COMPLETADA").length}
              </p>
            </div>
            {bigRock.aiScore !== null && (
              <div>
                <p className="text-sm text-gray-500">Score IA</p>
                <p className="font-medium">{bigRock.aiScore}/100</p>
              </div>
            )}
          </div>

          {/* AI Feedback */}
          {(bigRock.aiObservations || bigRock.aiRecommendations) && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-900">Feedback de IA</h3>

              {bigRock.aiObservations && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </p>
                  <p className="text-sm text-gray-600">{bigRock.aiObservations}</p>
                </div>
              )}

              {bigRock.aiRecommendations && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Recomendaciones
                  </p>
                  <p className="text-sm text-gray-600">
                    {bigRock.aiRecommendations}
                  </p>
                </div>
              )}

              {bigRock.aiRisks && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Alertas de Riesgo
                  </p>
                  <p className="text-sm text-red-700">{bigRock.aiRisks}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TARs section */}
      {bigRock.tars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              TARs ({bigRock.tars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bigRock.tars.map((tar) => (
                <div
                  key={tar.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tar.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{tar.status}</span>
                      {tar.progress > 0 && (
                        <span className="text-xs text-gray-500">
                          {tar.progress}% completado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Meetings section */}
      {bigRock.keyMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Reuniones Clave ({bigRock.keyMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bigRock.keyMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-3 border rounded-lg"
                >
                  <p className="text-sm font-medium">{meeting.title}</p>
                  {meeting.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {meeting.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
