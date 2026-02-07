"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import { removeTeamMember, updateTeamMemberRole } from "@/app/actions/okr";
import { TeamMemberRole } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  role: TeamMemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface TeamMemberListProps {
  teamId: string;
  members: TeamMember[];
  canManageMembers: boolean;
}

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  RESPONSABLE: "Responsable",
  EDITOR: "Editor",
  VISUALIZADOR: "Visualizador",
  DIRECTOR: "Director",
};

const ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  RESPONSABLE: "Crea, edita y elimina objetivos",
  EDITOR: "Puede editar objetivos existentes",
  VISUALIZADOR: "Solo puede ver objetivos",
  DIRECTOR: "Supervisor, solo visualiza",
};

const ROLE_COLORS: Record<TeamMemberRole, string> = {
  RESPONSABLE: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  EDITOR: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  VISUALIZADOR: "bg-muted text-muted-foreground border-muted",
  DIRECTOR: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

export function TeamMemberList({ teamId, members, canManageMembers }: TeamMemberListProps) {
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = (userId: string) => {
    setRemovingId(userId);
    setError(null);
    startTransition(async () => {
      const result = await removeTeamMember(teamId, userId);
      if (!result.success) {
        setError(result.error || "Error al eliminar miembro");
      }
      setRemovingId(null);
    });
  };

  const handleRoleChange = (userId: string, newRole: TeamMemberRole) => {
    setUpdatingId(userId);
    setError(null);
    startTransition(async () => {
      const result = await updateTeamMemberRole(teamId, userId, newRole);
      if (!result.success) {
        setError(result.error || "Error al cambiar rol");
      }
      setUpdatingId(null);
    });
  };

  // Count responsables to prevent removing the last one
  const responsableCount = members.filter(m => m.role === TeamMemberRole.RESPONSABLE).length;

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
      {members.map((member) => {
        const isLastResponsable = member.role === TeamMemberRole.RESPONSABLE && responsableCount <= 1;

        return (
          <div
            key={member.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {member.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.image}
                    alt={member.user.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {member.user.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{member.user.name || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {canManageMembers ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${ROLE_COLORS[member.role]} border`}
                      disabled={isPending && updatingId === member.user.id}
                    >
                      {isPending && updatingId === member.user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      {ROLE_LABELS[member.role]}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {Object.values(TeamMemberRole).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleRoleChange(member.user.id, role)}
                        disabled={
                          role === member.role ||
                          (isLastResponsable && role !== TeamMemberRole.RESPONSABLE)
                        }
                        className="flex flex-col items-start"
                      >
                        <span className="font-medium">{ROLE_LABELS[role]}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[role]}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant="outline" className={ROLE_COLORS[member.role]}>
                  {ROLE_LABELS[member.role]}
                </Badge>
              )}
              {canManageMembers && !isLastResponsable && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50"
                      disabled={isPending && removingId === member.user.id}
                    >
                      {isPending && removingId === member.user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar a {member.user.name} del equipo?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(member.user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
