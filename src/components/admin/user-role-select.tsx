"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleConfig } from "@/types/user";
import { updateUserRole } from "@/app/actions/users";
import { Loader2 } from "lucide-react";

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}

const roles: UserRole[] = ["USER", "SUPERVISOR", "ADMIN"];

export function UserRoleSelect({
  userId,
  currentRole,
  disabled = false,
}: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, value as UserRole);
      if (!result.success) {
        setError(result.error || "Error al actualizar");
      }
    });
  };

  return (
    <div>
      <Select
        value={currentRole}
        onValueChange={handleChange}
        disabled={disabled || isPending}
      >
        <SelectTrigger className="w-full">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {roleConfig[role].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
