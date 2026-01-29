import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyTAR } from "@/lib/auth";
import { TARForm } from "@/components/tars/tar-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
    tarId: string;
  }>;
}

/**
 * Edit TAR page
 * Server Component that renders the TAR edit form
 */
export default async function EditTARPage({ params }: PageProps) {
  const { id: bigRockId, tarId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this TAR
  const canModify = await canModifyTAR(tarId, user.id, userRole);
  if (!canModify) {
    redirect(`/big-rocks/${bigRockId}/tars/${tarId}`);
  }

  // Fetch TAR with Big Rock context
  const tar = await prisma.tAR.findUnique({
    where: { id: tarId },
    include: {
      bigRock: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!tar || tar.bigRock.id !== bigRockId) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href={`/big-rocks/${bigRockId}/tars/${tarId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a TAR
          </Button>
        </Link>
      </div>

      {/* Form */}
      <TARForm
        tar={tar}
        bigRockId={bigRockId}
        bigRockTitle={tar.bigRock.title}
        mode="edit"
      />
    </div>
  );
}
