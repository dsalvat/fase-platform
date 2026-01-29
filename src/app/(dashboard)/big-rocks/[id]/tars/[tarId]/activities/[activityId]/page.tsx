import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessActivity, canModifyActivity } from "@/lib/auth";
import { ActivityTypeBadge } from "@/components/activities/activity-type-badge";
import { ActivityDeleteButton } from "@/components/activities/activity-delete-button";
import { ActivityCompletionToggle } from "@/components/activities/activity-completion-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import { isMonthReadOnly } from "@/lib/month-helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
  params: Promise<{
    id: string;
    tarId: string;
    activityId: string;
  }>;
}

/**
 * Activity detail page
 */
export default async function ActivityDetailPage({ params }: PageProps) {
  const { id: bigRockId, tarId, activityId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessActivity(activityId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Activity with full details
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      tar: {
        select: {
          id: true,
          description: true,
          bigRock: {
            select: {
              id: true,
              title: true,
              month: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!activity || activity.tar.bigRock.id !== bigRockId || activity.tar.id !== tarId) {
    notFound();
  }

  const isReadOnly = isMonthReadOnly(activity.tar.bigRock.month);
  const canModify = await canModifyActivity(activityId, user.id, userRole);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Link href={`/big-rocks/${bigRockId}/tars/${tarId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a TAR
          </Button>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link href={`/big-rocks/${bigRockId}/tars/${tarId}/activities/${activityId}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <ActivityDeleteButton
              activityId={activityId}
              activityTitle={activity.title}
              tarId={tarId}
              bigRockId={bigRockId}
            />
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Esta actividad es de un mes pasado y no puede ser editada.
          </p>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                TAR: {activity.tar.description.substring(0, 100)}...
              </p>
              <CardTitle className="text-xl">{activity.title}</CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <ActivityTypeBadge type={activity.type} />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(activity.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
            {canModify && !isReadOnly && (
              <ActivityCompletionToggle
                activityId={activityId}
                initialCompleted={activity.completed}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                activity.completed
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {activity.completed ? "Completada" : "Pendiente"}
            </span>
          </div>

          {/* Description */}
          {activity.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Descripcion</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
            </div>
          )}

          {/* Notes */}
          {activity.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Notas / Reflexion</h3>
              <p className="text-yellow-700 whitespace-pre-wrap">{activity.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Semana</p>
              <p className="font-medium">{activity.week || "No asignada"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Creada</p>
              <p className="font-medium">
                {format(new Date(activity.createdAt), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
