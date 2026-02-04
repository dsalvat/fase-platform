"use client";

import { LogEntityType, LogActionType } from "@prisma/client";
import { entityTypeConfig, actionTypeConfig, ViewableUser } from "@/types/activity-log";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActivityLogFiltersProps {
  entityType: LogEntityType | null;
  action: LogActionType | null;
  userId: string | null;
  viewableUsers: ViewableUser[];
  showUserFilter: boolean;
  onEntityTypeChange: (value: LogEntityType | null) => void;
  onActionChange: (value: LogActionType | null) => void;
  onUserIdChange: (value: string | null) => void;
  onClearFilters: () => void;
}

const entityTypes: LogEntityType[] = [
  "BIG_ROCK",
  "TAR",
  "ACTIVITY",
  "KEY_MEETING",
];

const actionTypes: LogActionType[] = ["CREATE", "UPDATE", "DELETE"];

export function ActivityLogFilters({
  entityType,
  action,
  userId,
  viewableUsers,
  showUserFilter,
  onEntityTypeChange,
  onActionChange,
  onUserIdChange,
  onClearFilters,
}: ActivityLogFiltersProps) {
  const hasFilters = entityType !== null || action !== null || userId !== null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted rounded-lg">
      {/* Entity Type Filter */}
      <div className="flex-shrink-0">
        <Select
          value={entityType || "all"}
          onValueChange={(value) =>
            onEntityTypeChange(value === "all" ? null : (value as LogEntityType))
          }
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Tipo de entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {entityTypeConfig[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Filter */}
      <div className="flex-shrink-0">
        <Select
          value={action || "all"}
          onValueChange={(value) =>
            onActionChange(value === "all" ? null : (value as LogActionType))
          }
        >
          <SelectTrigger className="w-[150px] bg-background">
            <SelectValue placeholder="Accion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {actionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {actionTypeConfig[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Filter (only for supervisors and admins) */}
      {showUserFilter && viewableUsers.length > 1 && (
        <div className="flex-shrink-0">
          <Select
            value={userId || "all"}
            onValueChange={(value) =>
              onUserIdChange(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {viewableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
