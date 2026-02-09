import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BigRockStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { BigRockDeleteButton } from "@/components/big-rocks/big-rock-delete-button";
import { BigRockConfirmButton } from "@/components/big-rocks/big-rock-confirm-button";
import { FaseCategoryBadge } from "@/components/big-rocks/fase-category-badge";
import { TARList } from "@/components/tars/tar-list";
import { KeyMeetingList } from "@/components/key-meetings";
import { FeedbackDisplay } from "@/components/feedback";
import { getBigRockFeedback } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, CheckCircle2, Circle, Clock, Plus, Calendar, ShieldCheck, Users, MessageSquare, Play } from "lucide-react";
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
  CREADO: {
    label: "Creado",
    icon: Circle,
    color: "text-muted-foreground",
  },
  CONFIRMADO: {
    label: "Confirmado",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  FEEDBACK_RECIBIDO: {
    label: "Feedback Recibido",
    icon: MessageSquare,
    color: "text-purple-500",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    icon: Play,
    color: "text-orange-500",
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
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
  const isOwner = bigRock.userId === user.id;
  // A Big Rock is "confirmed" when status is not CREADO
  const isConfirmed = bigRock.status !== "CREADO";

  // Calculate Big Rock progress based on average TAR progress
  const totalProgress = bigRock.tars.reduce((sum, tar) => sum + tar.progress, 0);
  const bigRockProgress = bigRock.tars.length > 0 ? Math.round(totalProgress / bigRock.tars.length) : 0;

  // Get supervisor feedback for the Big Rock (only visible to owner)
  const feedback = isOwner ? await getBigRockFeedback(id) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Link href={`/big-rocks?month=${bigRock.month}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        {canEdit && (
          <div className="flex items-center gap-2">
            {!isConfirmed && (
              <BigRockConfirmButton
                bigRockId={id}
                bigRockTitle={bigRock.title}
              />
            )}
            <Link href={`/big-rocks/${id}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </Link>
            {!isConfirmed && (
              <BigRockDeleteButton
                bigRockId={id}
                bigRockTitle={bigRock.title}
              />
            )}
          </div>
        )}
      </div>

      {/* Confirmed banner */}
      {isConfirmed && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>Big Rock confirmado.</strong> Solo puedes gestionar TARs, Reuniones Clave y Personas Clave.
          </p>
        </div>
      )}

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={statusInfo.color} />
                  <span>{statusInfo.label}</span>
                </div>
                {bigRock.category && (
                  <FaseCategoryBadge category={bigRock.category} size="md" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
            <p className="text-foreground whitespace-pre-wrap">{bigRock.description}</p>
          </div>

          {/* Indicator */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Indicador de Éxito</h3>
            <p className="text-foreground">{bigRock.indicator}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Mes</p>
              <p className="font-medium">{formatMonthLabel(bigRock.month)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categoría FASE</p>
              <div className="mt-0.5">
                {bigRock.category ? (
                  <FaseCategoryBadge category={bigRock.category} size="sm" />
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TARs Planificadas</p>
              <p className="font-medium">{bigRock.numTars}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TARs Completadas</p>
              <p className="font-medium">
                {bigRock.tars.filter((t) => t.status === "COMPLETADA").length}
              </p>
            </div>
            {bigRock.aiScore !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Score IA</p>
                <p className="font-medium">{bigRock.aiScore}/100</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {bigRock.tars.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Progreso General</h3>
                <span className={`text-lg font-bold ${
                  bigRockProgress === 100 ? "text-green-600" : bigRockProgress > 0 ? "text-blue-600" : "text-muted-foreground"
                }`}>
                  {bigRockProgress}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    bigRockProgress === 100 ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${bigRockProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basado en el progreso promedio de las {bigRock.tars.length} TAR{bigRock.tars.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* AI Feedback */}
          {(bigRock.aiObservations || bigRock.aiRecommendations) && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-foreground">Feedback de IA</h3>

              {bigRock.aiObservations && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Observaciones
                  </p>
                  <p className="text-sm text-muted-foreground">{bigRock.aiObservations}</p>
                </div>
              )}

              {bigRock.aiRecommendations && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Recomendaciones
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bigRock.aiRecommendations}
                  </p>
                </div>
              )}

              {bigRock.aiRisks && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                    Alertas de Riesgo
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">{bigRock.aiRisks}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TARs section */}
      <Card data-tour="tars-section">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 shrink-0" />
              Reuniones Clave ({bigRock.keyMeetings.length})
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <Link href={`/big-rocks/${id}/meetings/new`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Anadir Reunion</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0" />
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
              {bigRock.keyPeople.map((keyPerson) => (
                <div
                  key={keyPerson.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {keyPerson.user.image ? (
                    <Image
                      src={keyPerson.user.image}
                      alt={keyPerson.user.name || keyPerson.user.email}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  <span>{keyPerson.user.name || keyPerson.user.email}</span>
                  {keyPerson.role && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">({keyPerson.role})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Feedback section - only visible to owner when feedback exists */}
      {isOwner && feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback del Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackDisplay feedback={feedback} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
