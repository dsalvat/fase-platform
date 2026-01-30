import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessKeyMeeting, canModifyKeyMeeting } from "@/lib/auth";
import { KeyMeetingDeleteButton, KeyMeetingCompletionToggle } from "@/components/key-meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Calendar, CheckCircle2, Clock } from "lucide-react";
import { isMonthReadOnly, formatMonthLabel } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
    meetingId: string;
  }>;
}

/**
 * Key Meeting detail page
 * Server Component that fetches and displays full Key Meeting details
 */
export default async function KeyMeetingDetailPage({ params }: PageProps) {
  const { id: bigRockId, meetingId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessKeyMeeting(meetingId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Key Meeting with full details
  const keyMeeting = await prisma.keyMeeting.findUnique({
    where: { id: meetingId },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
          month: true,
          userId: true,
        },
      },
    },
  });

  if (!keyMeeting || keyMeeting.bigRock.id !== bigRockId) {
    notFound();
  }

  const isReadOnly = isMonthReadOnly(keyMeeting.bigRock.month);
  const canModify = await canModifyKeyMeeting(meetingId, user.id, userRole);

  const meetingDate = new Date(keyMeeting.date);
  const isPast = meetingDate < new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Link href={`/big-rocks/${bigRockId}/meetings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Reuniones
          </Button>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link href={`/big-rocks/${bigRockId}/meetings/${meetingId}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <KeyMeetingDeleteButton
              keyMeetingId={meetingId}
              keyMeetingTitle={keyMeeting.title}
              bigRockId={bigRockId}
            />
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Esta reunion es de un mes pasado y no puede ser editada.
          </p>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Big Rock: {keyMeeting.bigRock.title}
              </p>
              <CardTitle className="text-xl">{keyMeeting.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {keyMeeting.completed ? (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Completada
                </div>
              ) : isPast ? (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm">
                  <Clock className="h-4 w-4" />
                  Pendiente
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                  <Calendar className="h-4 w-4" />
                  Programada
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Date */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Fecha y hora</h3>
            <p className="text-gray-700">{formatDate(meetingDate)}</p>
          </div>

          {/* Description */}
          {keyMeeting.description && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Descripcion</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {keyMeeting.description}
              </p>
            </div>
          )}

          {/* Outcome */}
          {keyMeeting.outcome && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Resultado</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {keyMeeting.outcome}
                </p>
              </div>
            </div>
          )}

          {/* Completion toggle */}
          {canModify && !isReadOnly && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Estado</h3>
              <KeyMeetingCompletionToggle
                keyMeetingId={meetingId}
                completed={keyMeeting.completed}
                showOutcomeInput={!keyMeeting.completed}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Mes</p>
              <p className="font-medium">
                {formatMonthLabel(keyMeeting.bigRock.month)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Creada</p>
              <p className="font-medium">
                {new Date(keyMeeting.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
