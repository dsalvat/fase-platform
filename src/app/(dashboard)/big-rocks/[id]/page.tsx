import Link from "next/link";
import { notFound } from "next/navigation";
import { BigRockStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { BigRockDeleteButton } from "@/components/big-rocks/big-rock-delete-button";
import { BigRockConfirmButton } from "@/components/big-rocks/big-rock-confirm-button";
import { TARList } from "@/components/tars/tar-list";
import { KeyMeetingList } from "@/components/key-meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, CheckCircle2, Circle, Clock, Plus, Calendar, ShieldCheck, Users } from "lucide-react";
import { isMonthReadOnly, formatMonthLabel } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusConfig: Record<BigRockStatus, {
  label: string;
  icon: typeof Circle;
  color: string;
}> = {
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
        include: {
          _count: {
            select: {
              activities: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      keyMeetings: {
        orderBy: { createdAt: "asc" },
      },
      keyPeople: {
        orderBy: { firstName: "asc" },
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
            {!bigRock.isConfirmed && (
              <BigRockConfirmButton
                bigRockId={id}
                bigRockTitle={bigRock.title}
              />
            )}
            <Link href={`/big-rocks/${id}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            {!bigRock.isConfirmed && (
              <BigRockDeleteButton
                bigRockId={id}
                bigRockTitle={bigRock.title}
              />
            )}
          </div>
        )}
      </div>

      {/* Confirmed banner */}
      {bigRock.isConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            <strong>Big Rock confirmado.</strong> Solo puedes gestionar TARs, Reuniones Clave y Personas Clave.
          </p>
        </div>
      )}

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
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <StatusIcon className={statusInfo.color} />
                  <span>{statusInfo.label}</span>
                </div>
                {bigRock.isConfirmed && (
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Confirmado</span>
                  </div>
                )}
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              TARs ({bigRock.tars.length}/{bigRock.numTars})
            </CardTitle>
            {canEdit && (
              <Link href={`/big-rocks/${id}/tars/new`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Anadir TAR
                </Button>
              </Link>
            )}
          </div>
          {bigRock.tars.length < bigRock.numTars && (
            <p className="text-sm text-muted-foreground">
              {bigRock.numTars - bigRock.tars.length} TARs pendientes de crear
            </p>
          )}
        </CardHeader>
        <CardContent>
          <TARList
            tars={bigRock.tars}
            bigRockId={id}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      {/* Key Meetings section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reuniones Clave ({bigRock.keyMeetings.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Link href={`/big-rocks/${id}/meetings/new`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Anadir Reunion
                  </Button>
                </Link>
              )}
              <Link href={`/big-rocks/${id}/meetings`}>
                <Button size="sm" variant="ghost">
                  Ver todas
                </Button>
              </Link>
            </div>
          </div>
          {bigRock.keyMeetings.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {bigRock.keyMeetings.filter(m => m.completed).length} de {bigRock.keyMeetings.length} completadas
            </p>
          )}
        </CardHeader>
        <CardContent>
          <KeyMeetingList
            keyMeetings={bigRock.keyMeetings.slice(0, 5)}
            bigRockId={id}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
          />
          {bigRock.keyMeetings.length > 5 && (
            <div className="mt-4 text-center">
              <Link href={`/big-rocks/${id}/meetings`}>
                <Button variant="outline" size="sm">
                  Ver {bigRock.keyMeetings.length - 5} reuniones mas
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key People section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personas Clave ({bigRock.keyPeople.length})
            </CardTitle>
            {canEdit && (
              <Link href={`/big-rocks/${id}/edit`}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Gestionar
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bigRock.keyPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay personas clave asociadas a este Big Rock.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bigRock.keyPeople.map((person) => (
                <Link
                  key={person.id}
                  href={`/key-people/${person.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                >
                  <Users className="h-3 w-3" />
                  <span>{person.firstName} {person.lastName}</span>
                  {person.role && (
                    <span className="text-xs text-blue-500">({person.role})</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
