"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserListItem, roleConfig } from "@/types/user";
import { UserRoleSelect } from "./user-role-select";
import { UserSupervisorSelect } from "./user-supervisor-select";

interface UserListProps {
  users: UserListItem[];
  allUsers: { id: string; name: string | null; email: string }[];
  currentUserId: string;
}

const roleIcons = {
  USER: User,
  SUPERVISOR: Users,
  ADMIN: ShieldCheck,
};

export function UserList({ users, allUsers, currentUserId }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se encontraron usuarios
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          allUsers={allUsers}
          isCurrentUser={user.id === currentUserId}
        />
      ))}
    </div>
  );
}

interface UserCardProps {
  user: UserListItem;
  allUsers: { id: string; name: string | null; email: string }[];
  isCurrentUser: boolean;
}

function UserCard({ user, allUsers, isCurrentUser }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const roleInfo = roleConfig[user.role];
  const RoleIcon = roleIcons[user.role];

  // Filter out the user from potential supervisors (can't supervise themselves)
  const potentialSupervisors = allUsers.filter((u) => u.id !== user.id);

  return (
    <Card className={cn(isCurrentUser && "border-blue-300 bg-blue-50/30")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || ""}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.name || "Sin nombre"}
              </h3>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Tu
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>

            <div className="flex items-center gap-3 mt-2">
              {/* Role badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                  roleInfo.bgColor,
                  roleInfo.color
                )}
              >
                <RoleIcon className="w-3 h-3" />
                {roleInfo.label}
              </span>

              {/* Supervisor info */}
              {user.supervisor && (
                <span className="text-xs text-gray-500">
                  Supervisor: {user.supervisor.name || user.supervisor.email}
                </span>
              )}

              {/* Supervisees count */}
              {user._count.supervisees > 0 && (
                <span className="text-xs text-gray-500">
                  {user._count.supervisees} supervisado(s)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Cerrar" : "Editar"}
            </Button>
          </div>
        </div>

        {/* Expanded edit section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <UserRoleSelect
                  userId={user.id}
                  currentRole={user.role}
                  disabled={isCurrentUser}
                />
                {isCurrentUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    No puedes cambiar tu propio rol
                  </p>
                )}
              </div>

              {/* Supervisor selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor
                </label>
                <UserSupervisorSelect
                  userId={user.id}
                  currentSupervisorId={user.supervisor?.id || null}
                  potentialSupervisors={potentialSupervisors}
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Registrado el {new Date(user.createdAt).toLocaleDateString("es-ES")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
