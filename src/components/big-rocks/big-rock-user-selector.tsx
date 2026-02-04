"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, X, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface BigRockUserSelectorProps {
  availableUsers: UserOption[];
  selectedUserIds: string[];
  onSelect: (userId: string) => void;
  onDeselect: (userId: string) => void;
  disabled?: boolean;
}

/**
 * Selector for choosing users as Key People for a Big Rock
 */
export function BigRockUserSelector({
  availableUsers,
  selectedUserIds,
  onSelect,
  onDeselect,
  disabled = false,
}: BigRockUserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Get selected users
  const selectedUsers = availableUsers.filter((u) => selectedUserIds.includes(u.id));

  // Get available (unselected) users filtered by search
  const unselectedUsers = availableUsers.filter(
    (u) =>
      !selectedUserIds.includes(u.id) &&
      (searchQuery === "" ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Personas clave seleccionadas ({selectedUsers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.email}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{user.name || user.email}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onDeselect(user.id)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Users Section */}
      {!disabled && (
        <div className="space-y-3">
          {!isExpanded ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir persona clave
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Seleccionar usuarios
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User List */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {unselectedUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchQuery
                      ? "No se encontraron usuarios"
                      : "Todos los usuarios ya estan seleccionados"}
                  </p>
                ) : (
                  unselectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => onSelect(user.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                        "hover:bg-gray-100 transition-colors"
                      )}
                    >
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || user.email}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Check className="h-4 w-4 text-gray-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {selectedUsers.length === 0 && !isExpanded && (
        <p className="text-sm text-gray-500 italic">
          No hay personas clave seleccionadas
        </p>
      )}
    </div>
  );
}
