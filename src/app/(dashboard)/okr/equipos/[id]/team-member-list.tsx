"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { removeTeamMember } from "@/app/actions/okr";
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

interface TeamMember {
  id: string;
  role: string | null;
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
  isAdmin: boolean;
}

export function TeamMemberList({ teamId, members, isAdmin }: TeamMemberListProps) {
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (userId: string) => {
    setRemovingId(userId);
    startTransition(async () => {
      await removeTeamMember(teamId, userId);
      setRemovingId(null);
    });
  };

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {member.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.user.image}
                  alt={member.user.name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {member.user.name?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">{member.user.name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {member.role && (
              <span className="text-sm text-muted-foreground px-2 py-1 bg-gray-100 rounded">
                {member.role}
              </span>
            )}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      ))}
    </div>
  );
}
