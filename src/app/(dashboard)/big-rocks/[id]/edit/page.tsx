import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock } from "@/lib/auth";
import { BigRockForm } from "@/components/big-rocks/big-rock-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Edit Big Rock page
 * Server Component that checks permissions and renders the edit form
 */
export default async function EditBigRockPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this Big Rock
  const canModify = await canModifyBigRock(id, user.id, userRole);
  if (!canModify) {
    redirect(`/big-rocks/${id}`);
  }

  // Fetch Big Rock
  const bigRock = await prisma.bigRock.findUnique({
    where: { id },
    include: {
      tars: {
        select: {
          id: true,
          status: true,
        },
      },
      _count: {
        select: {
          keyMeetings: true,
        },
      },
    },
  });

  if (!bigRock) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/big-rocks/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al detalle
          </Button>
        </Link>
      </div>

      {/* Form */}
      <BigRockForm mode="edit" bigRock={bigRock} />
    </div>
  );
}
