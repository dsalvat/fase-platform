import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyKeyMeeting } from "@/lib/auth";
import { KeyMeetingForm } from "@/components/key-meetings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
    meetingId: string;
  }>;
}

/**
 * Edit Key Meeting page
 * Server Component that renders the Key Meeting edit form
 */
export default async function EditKeyMeetingPage({ params }: PageProps) {
  const { id: bigRockId, meetingId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this Key Meeting
  const canModify = await canModifyKeyMeeting(meetingId, user.id, userRole);
  if (!canModify) {
    redirect(`/big-rocks/${bigRockId}/meetings/${meetingId}`);
  }

  // Fetch Key Meeting with Big Rock context
  const keyMeeting = await prisma.keyMeeting.findUnique({
    where: { id: meetingId },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!keyMeeting || keyMeeting.bigRock.id !== bigRockId) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href={`/big-rocks/${bigRockId}/meetings/${meetingId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Reunion
          </Button>
        </Link>
      </div>

      {/* Form */}
      <KeyMeetingForm
        keyMeeting={keyMeeting}
        bigRockId={bigRockId}
        bigRockTitle={keyMeeting.bigRock.title}
        mode="edit"
      />
    </div>
  );
}
