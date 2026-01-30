"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, X, Mail } from "lucide-react";
import { inviteUser } from "@/app/actions/users";
import { UserRole } from "@prisma/client";

interface InviteUserDialogProps {
  potentialSupervisors: { id: string; name: string | null; email: string }[];
}

const roleOptions = [
  { value: "USER", label: "Usuario" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ADMIN", label: "Administrador" },
];

export function InviteUserDialog({ potentialSupervisors }: InviteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");

  const [state, formAction, isPending] = useActionState(inviteUser, null);

  // Close dialog on success
  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      setSelectedRole("USER");
      setSelectedSupervisorId("");
    }
  }, [state?.success]);

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invitar Usuario
      </Button>
    );
  }

  return (
    <Card className="fixed inset-0 m-auto w-full max-w-md h-fit z-50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitar Nuevo Usuario
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              El usuario recibira acceso cuando inicie sesion con este email
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nombre del usuario"
              disabled={isPending}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              name="role"
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supervisor */}
          <div className="space-y-2">
            <Label htmlFor="supervisorId">Supervisor (opcional)</Label>
            <Select
              name="supervisorId"
              value={selectedSupervisorId}
              onValueChange={setSelectedSupervisorId}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin supervisor</SelectItem>
                {potentialSupervisors.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error message */}
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{state.error}</p>
            </div>
          )}

          {/* Success message */}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <p className="text-sm">Usuario invitado correctamente</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Invitando..." : "Enviar Invitacion"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 -z-10"
        onClick={() => !isPending && setIsOpen(false)}
      />
    </Card>
  );
}
