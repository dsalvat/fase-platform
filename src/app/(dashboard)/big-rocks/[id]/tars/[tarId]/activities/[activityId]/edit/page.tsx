import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyActivity } from "@/lib/auth";
import { ActivityForm } from "@/components/activities/activity-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
    tarId: string;
    activityId: string;
  }>;
}

/**
 * Edit Activity page
 */
export default async function EditActivityPage({ params }: PageProps) {
  const { id: bigRockId, tarId, activityId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this Activity
  const canModify = await canModifyActivity(activityId, user.id, userRole);
  if (!canModify) {
    redirect(`/big-rocks/${bigRockId}/tars/${tarId}/activities/${activityId}`);
  }

  // Fetch Activity with TAR context
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      tar: {
        select: {
          id: true,
          description: true,
          bigRockId: true,
        },
      },
    },
  });

  if (!activity || activity.tar.bigRockId !== bigRockId || activity.tar.id !== tarId) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href={`/big-rocks/${bigRockId}/tars/${tarId}/activities/${activityId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Actividad
          </Button>
        </Link>
      </div>

      {/* Form */}
      <ActivityForm
        activity={activity}
        tarId={tarId}
        tarDescription={activity.tar.description}
        bigRockId={bigRockId}
        mode="edit"
      />
    </div>
  );
}
