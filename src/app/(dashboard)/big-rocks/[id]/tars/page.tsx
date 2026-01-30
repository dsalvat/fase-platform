import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { TARList } from "@/components/tars/tar-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { isMonthReadOnly } from "@/lib/month-helpers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * TAR list page for a specific Big Rock
 * Server Component that fetches and displays TARs
 */
export default async function TARsPage({ params }: PageProps) {
  const { id: bigRockId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Big Rock with TARs
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    include: {
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
    },
  });

  if (!bigRock) {
    notFound();
  }

  const isReadOnly = isMonthReadOnly(bigRock.month);
  const canEdit = bigRock.userId === user.id && !isReadOnly;

  // Calculate stats
  const totalTars = bigRock.tars.length;
  const completedTars = bigRock.tars.filter(
    (tar) => tar.status === "COMPLETADA"
  ).length;
  const inProgressTars = bigRock.tars.filter(
    (tar) => tar.status === "EN_PROGRESO"
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
          <Link href={`/big-rocks/${bigRockId}/tars/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva TAR
            </Button>
          </Link>
        )}
      </div>

      {/* Big Rock info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{bigRock.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tareas de Alto Rendimiento (TARs)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{totalTars}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{inProgressTars}</p>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedTars}</p>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
          </div>

          {/* Expected vs actual */}
          {bigRock.numTars > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  TARs planificadas: {bigRock.numTars}
                </span>
                <span
                  className={
                    totalTars >= bigRock.numTars
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {totalTars >= bigRock.numTars
                    ? "Objetivo alcanzado"
                    : `Faltan ${bigRock.numTars - totalTars} TARs`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            Este Big Rock es de un mes pasado. Las TARs son de solo lectura.
          </p>
        </div>
      )}

      {/* TAR List */}
      <Card>
        <CardHeader>
          <CardTitle>
            TARs ({totalTars})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TARList
            tars={bigRock.tars}
            bigRockId={bigRockId}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
