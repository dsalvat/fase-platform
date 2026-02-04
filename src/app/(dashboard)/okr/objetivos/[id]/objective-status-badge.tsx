"use client";

import { useState, useTransition } from "react";
import { OKRObjectiveStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateObjective } from "@/app/actions/okr";

const STATUS_CONFIG: Record<
  OKRObjectiveStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  ACTIVE: { label: "Activo", variant: "secondary" },
  COMPLETED: { label: "Completado", variant: "default" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

interface ObjectiveStatusBadgeProps {
  objectiveId: string;
  status: OKRObjectiveStatus;
  canEdit: boolean;
}

export function ObjectiveStatusBadge({
  objectiveId,
  status,
  canEdit,
}: ObjectiveStatusBadgeProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  const config = STATUS_CONFIG[currentStatus];

  const handleStatusChange = (newStatus: OKRObjectiveStatus) => {
    if (newStatus === currentStatus) return;

    setCurrentStatus(newStatus);
    startTransition(async () => {
      const result = await updateObjective(objectiveId, { status: newStatus });
      if (!result.success) {
        // Revert on error
        setCurrentStatus(status);
      }
    });
  };

  if (!canEdit) {
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none" disabled={isPending}>
          <Badge variant={config.variant} className="cursor-pointer gap-1">
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              config.label
            )}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(STATUS_CONFIG).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleStatusChange(key as OKRObjectiveStatus)}
            className="cursor-pointer"
          >
            <Badge variant={value.variant} className="mr-2">
              {value.label}
            </Badge>
            {key === currentStatus && "✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
