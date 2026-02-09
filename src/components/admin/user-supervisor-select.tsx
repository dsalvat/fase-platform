"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignSupervisor } from "@/app/actions/users";
import { Loader2 } from "lucide-react";

interface UserSupervisorSelectProps {
  userId: string;
  currentSupervisorId: string | null;
  companyId: string;
  potentialSupervisors: { id: string; name: string | null; email: string }[];
}

export function UserSupervisorSelect({
  userId,
  currentSupervisorId,
  companyId,
  potentialSupervisors,
}: UserSupervisorSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setError(null);
    const supervisorId = value === "none" ? null : value;

    startTransition(async () => {
      const result = await assignSupervisor(userId, supervisorId, companyId);
      if (!result.success) {
        setError(result.error || "Error al asignar supervisor");
      }
    });
  };

  return (
    <div>
      <Select
        value={currentSupervisorId || "none"}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : (
            <SelectValue placeholder="Seleccionar supervisor" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin supervisor</SelectItem>
          {potentialSupervisors.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
