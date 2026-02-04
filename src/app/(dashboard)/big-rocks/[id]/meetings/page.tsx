import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { KeyMeetingList } from "@/components/key-meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Clock } from "lucide-react";
import { isMonthReadOnly } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Key Meetings list page for a specific Big Rock
 * Server Component that fetches and displays Key Meetings
 */
export default async function KeyMeetingsPage({ params }: PageProps) {
  const { id: bigRockId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Big Rock with Key Meetings
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    include: {
      keyMeetings: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!bigRock) {
    notFound();
  }

  const isReadOnly = isMonthReadOnly(bigRock.month);
  const canEdit = bigRock.userId === user.id && !isReadOnly;

  // Calculate stats
  const totalMeetings = bigRock.keyMeetings.length;
  const completedMeetings = bigRock.keyMeetings.filter(
    (m) => m.completed
  ).length;
  const now = new Date();
  const upcomingMeetings = bigRock.keyMeetings.filter(
    (m) => !m.completed && new Date(m.date) > now
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between">
        <Link href={`/big-rocks/${bigRockId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Big Rock
          </Button>
        </Link>

        {canEdit && (
          <Link href={`/big-rocks/${bigRockId}/meetings/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reunion
            </Button>
          </Link>
        )}
      </div>

      {/* Big Rock info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{bigRock.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reuniones Clave
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalMeetings}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{upcomingMeetings}</p>
              </div>
              <p className="text-sm text-muted-foreground">Proximas</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{completedMeetings}</p>
              </div>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Este Big Rock es de un mes pasado. Las reuniones son de solo lectura.
          </p>
        </div>
      )}

      {/* Key Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Reuniones ({totalMeetings})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeyMeetingList
            keyMeetings={bigRock.keyMeetings}
            bigRockId={bigRockId}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
