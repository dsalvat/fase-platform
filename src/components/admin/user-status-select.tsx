"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatus } from "@prisma/client";
import { updateUserStatus } from "@/app/actions/users";
import { statusConfig } from "@/types/user";

interface UserStatusSelectProps {
  userId: string;
  currentStatus: UserStatus;
  disabled?: boolean;
}

const statusOptions: UserStatus[] = ["INVITED", "ACTIVE", "DEACTIVATED"];

export function UserStatusSelect({
  userId,
  currentStatus,
  disabled = false,
}: UserStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<UserStatus>(currentStatus);

  const handleStatusChange = (newStatus: UserStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateUserStatus(userId, newStatus);
      if (!result.success) {
        // Revert on error
        setStatus(currentStatus);
        console.error("Error updating status:", result.error);
      }
    });
  };

  return (
    <Select
      value={status}
      onValueChange={(value) => handleStatusChange(value as UserStatus)}
      disabled={disabled || isPending}
    >
      <SelectTrigger className={isPending ? "opacity-50" : ""}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option} value={option}>
            <span className={statusConfig[option].color}>
              {statusConfig[option].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
