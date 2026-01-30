import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyKeyPerson } from "@/lib/auth";
import { KeyPersonForm } from "@/components/key-people";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    personId: string;
  }>;
}

/**
 * Edit Key Person page
 * Server Component that renders the Key Person edit form
 */
export default async function EditKeyPersonPage({ params }: PageProps) {
  const { personId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check if user can modify this Key Person
  const canModify = await canModifyKeyPerson(personId, user.id, userRole);
  if (!canModify) {
    redirect(`/key-people/${personId}`);
  }

  // Fetch Key Person
  const keyPerson = await prisma.keyPerson.findUnique({
    where: { id: personId },
  });

  if (!keyPerson) {
    notFound();
  }

  const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href={`/key-people/${personId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a {fullName}
          </Button>
        </Link>
      </div>

      {/* Form */}
      <KeyPersonForm keyPerson={keyPerson} mode="edit" />
    </div>
  );
}
