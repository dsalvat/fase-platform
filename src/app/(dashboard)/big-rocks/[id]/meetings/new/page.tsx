import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock } from "@/lib/auth";
import { KeyMeetingForm } from "@/components/key-meetings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Create Key Meeting page
 * Server Component that renders the Key Meeting creation form
 */
export default async function NewKeyMeetingPage({ params }: PageProps) {
  const { id: bigRockId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this Big Rock
  const canModify = await canModifyBigRock(bigRockId, user.id, userRole);
  if (!canModify) {
    redirect(`/big-rocks/${bigRockId}/meetings`);
  }

  // Fetch Big Rock for context
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    select: {
      id: true,
      title: true,
      month: true,
    },
  });

  if (!bigRock) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href={`/big-rocks/${bigRockId}/meetings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Reuniones
          </Button>
        </Link>
      </div>

      {/* Form */}
      <KeyMeetingForm
        bigRockId={bigRockId}
        bigRockTitle={bigRock.title}
        mode="create"
      />
    </div>
  );
}
