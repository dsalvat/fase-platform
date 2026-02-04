import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { EditTeamForm } from "./edit-team-form";

interface EditTeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params;
  const user = await requireAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  // Only admins can edit teams
  if (!isAdmin) {
    redirect("/okr/equipos");
  }

  // Get team data
  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!team) {
    notFound();
  }

  return <EditTeamForm team={team} />;
}
