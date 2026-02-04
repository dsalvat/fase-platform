import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
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

  // Fetch Big Rock with keyPeople (users) and keyMeetings
  const bigRock = await prisma.bigRock.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      tars: {
        select: {
          id: true,
          status: true,
          progress: true,
        },
      },
      keyPeople: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      keyMeetings: true,
      _count: {
        select: {
          keyMeetings: true,
          keyPeople: true,
        },
      },
    },
  });

  if (!bigRock) {
    notFound();
  }

  // Get current company
  const companyId = await getCurrentCompanyId();

  // Fetch all users with FASE app access in the same company (for key people selection)
  const availableUsers = companyId
    ? await prisma.user.findMany({
        where: {
          companies: {
            some: { companyId },
          },
          apps: {
            some: {
              app: { code: "FASE" },
            },
          },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

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
      <BigRockForm
        mode="edit"
        bigRock={bigRock}
        availableUsers={availableUsers}
        isConfirmed={bigRock.status !== "CREADO"}
        canResetStatus={userRole === "ADMIN" || userRole === "SUPERADMIN"}
      />
    </div>
  );
}
