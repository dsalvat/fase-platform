import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessTAR, canModifyTAR } from "@/lib/auth";
import { TARStatusBadge } from "@/components/tars/tar-status-badge";
import { TARDeleteButton } from "@/components/tars/tar-delete-button";
import { TARProgressSlider } from "@/components/tars/tar-progress-slider";
import { TARStatusToggle } from "@/components/tars/tar-status-toggle";
import { ActivityList } from "@/components/activities/activity-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { isMonthReadOnly, formatMonthLabel } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
    tarId: string;
  }>;
}

/**
 * TAR detail page
 * Server Component that fetches and displays full TAR details
 */
export default async function TARDetailPage({ params }: PageProps) {
  const { id: bigRockId, tarId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessTAR(tarId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch TAR with full details
  const tar = await prisma.tAR.findUnique({
    where: { id: tarId },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
          month: true,
          userId: true,
        },
      },
      activities: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!tar || tar.bigRock.id !== bigRockId) {
    notFound();
  }

  const isReadOnly = isMonthReadOnly(tar.bigRock.month);
  const canModify = await canModifyTAR(tarId, user.id, userRole);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Link href={`/big-rocks/${bigRockId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Big Rock
          </Button>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link href={`/big-rocks/${bigRockId}/tars/${tarId}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <TARDeleteButton
              tarId={tarId}
              tarDescription={tar.description}
              bigRockId={bigRockId}
            />
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Esta TAR es de un mes pasado y no puede ser editada.
          </p>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Big Rock: {tar.bigRock.title}
              </p>
              <CardTitle className="text-xl">TAR</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {canModify ? (
                <TARStatusToggle
                  tarId={tarId}
                  initialStatus={tar.status}
                  disabled={isReadOnly}
                />
              ) : (
                <TARStatusBadge status={tar.status} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descripcion</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{tar.description}</p>
          </div>

          {/* Progress */}
          <div className="pt-4 border-t">
            {canModify && !isReadOnly ? (
              <TARProgressSlider
                tarId={tarId}
                initialProgress={tar.progress}
                disabled={isReadOnly}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progreso
                  </span>
                  <span className="text-lg font-semibold">{tar.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      tar.progress === 100 ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${tar.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Mes</p>
              <p className="font-medium">{formatMonthLabel(tar.bigRock.month)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Creada</p>
              <p className="font-medium">
                {new Date(tar.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Actividades ({tar.activities.length})
            </CardTitle>
            {canModify && !isReadOnly && (
              <Link href={`/big-rocks/${bigRockId}/tars/${tarId}/activities/new`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Anadir Actividad
                </Button>
              </Link>
            )}
          </div>
          {tar.activities.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {tar.activities.filter(a => a.completed).length} de {tar.activities.length} completadas
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ActivityList
            activities={tar.activities}
            isReadOnly={isReadOnly}
            canEdit={canModify}
          />
        </CardContent>
      </Card>

    </div>
  );
}
