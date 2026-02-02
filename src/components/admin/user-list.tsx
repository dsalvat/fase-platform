"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Users, ShieldCheck, Crown, Filter, Building2, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { UserListItem, roleConfig, statusConfig } from "@/types/user";
import { UserRoleSelect } from "./user-role-select";
import { UserSupervisorSelect } from "./user-supervisor-select";
import { UserStatusSelect } from "./user-status-select";
import { UserCompanySelect } from "./user-company-select";
import { UserStatus } from "@prisma/client";

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

interface UserListTranslations {
  hideDeactivated: string;
  showingUsersTemplate: string; // Template with {count} and {total} placeholders
  noResults: string;
  you: string;
  noName: string;
  role: string;
  status: string;
  supervisor: string;
  company: string;
  cannotChangeOwnRole: string;
  cannotChangeOwnStatus: string;
  registeredOn: string;
  edit: string;
  close: string;
  noCompany: string;
  saving: string;
  viewBigRocks: string;
}

interface UserListProps {
  users: UserListItem[];
  allUsers: { id: string; name: string | null; email: string }[];
  currentUserId: string;
  companies?: Company[];
  isSuperAdmin?: boolean;
  translations?: UserListTranslations;
}

const roleIcons = {
  USER: User,
  SUPERVISOR: Users,
  ADMIN: ShieldCheck,
  SUPERADMIN: Crown,
};

// Helper to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Default translations (Spanish)
const defaultTranslations: UserListTranslations = {
  hideDeactivated: "Ocultar usuarios desactivados",
  showingUsersTemplate: "Mostrando {count} de {total} usuarios",
  noResults: "No se encontraron usuarios",
  you: "Tu",
  noName: "Sin nombre",
  role: "Rol",
  status: "Estado",
  supervisor: "Supervisor",
  company: "Empresa",
  cannotChangeOwnRole: "No puedes cambiar tu propio rol",
  cannotChangeOwnStatus: "No puedes cambiar tu propio estado",
  registeredOn: "Registrado el",
  edit: "Editar",
  close: "Cerrar",
  noCompany: "Sin empresa",
  saving: "Guardando...",
  viewBigRocks: "Ver Big Rocks",
};

// Helper function to format the showingUsers template
function formatShowingUsers(template: string, count: number, total: number): string {
  return template.replace("{count}", String(count)).replace("{total}", String(total));
}

export function UserList({
  users,
  allUsers,
  currentUserId,
  companies = [],
  isSuperAdmin = false,
  translations: t = defaultTranslations,
}: UserListProps) {
  const [hideDeactivated, setHideDeactivated] = useState(true);

  const filteredUsers = hideDeactivated
    ? users.filter((u) => u.status !== UserStatus.DEACTIVATED)
    : users;

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <Filter className="h-4 w-4 text-gray-500" />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideDeactivated}
            onChange={(e) => setHideDeactivated(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>{t.hideDeactivated}</span>
        </label>
        <span className="text-sm text-gray-500 ml-auto">
          {formatShowingUsers(t.showingUsersTemplate, filteredUsers.length, users.length)}
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t.noResults}
        </div>
      ) : (
        filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            allUsers={allUsers}
            isCurrentUser={user.id === currentUserId}
            companies={companies}
            isSuperAdmin={isSuperAdmin}
            translations={t}
          />
        ))
      )}
    </div>
  );
}

interface UserCardProps {
  user: UserListItem;
  allUsers: { id: string; name: string | null; email: string }[];
  isCurrentUser: boolean;
  companies: Company[];
  isSuperAdmin: boolean;
  translations: UserListTranslations;
}

function UserCard({
  user,
  allUsers,
  isCurrentUser,
  companies,
  isSuperAdmin,
  translations: t,
}: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const roleInfo = roleConfig[user.role];
  const statusInfo = statusConfig[user.status];
  const RoleIcon = roleIcons[user.role];

  // Filter out the user from potential supervisors (can't supervise themselves)
  const potentialSupervisors = allUsers.filter((u) => u.id !== user.id);

  return (
    <Card className={cn(
      isCurrentUser && "border-blue-300 bg-blue-50/30",
      user.status === UserStatus.DEACTIVATED && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
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
            {/* Status indicator dot */}
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                user.status === UserStatus.ACTIVE && "bg-green-500",
                user.status === UserStatus.INVITED && "bg-amber-500",
                user.status === UserStatus.DEACTIVATED && "bg-red-500"
              )}
              title={statusInfo.label}
            />
          </div>

          {/* User Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.name || t.noName}
              </h3>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {t.you}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
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

              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                {statusInfo.label}
              </span>

              {/* Company badge */}
              {user.company && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {user.company.logo ? (
                    <div className="relative w-3 h-3 rounded overflow-hidden">
                      <Image
                        src={user.company.logo}
                        alt={user.company.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <Building2 className="w-3 h-3" />
                  )}
                  {user.company.name}
                </span>
              )}

              {/* Supervisor info */}
              {user.supervisor && (
                <span className="text-xs text-gray-500">
                  {t.supervisor}: {user.supervisor.name || user.supervisor.email}
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
              {isExpanded ? t.close : t.edit}
            </Button>
          </div>
        </div>

        {/* Expanded edit section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className={cn(
              "grid gap-4",
              isSuperAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"
            )}>
              {/* Role selector */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.role}
                </Label>
                <UserRoleSelect
                  userId={user.id}
                  currentRole={user.role}
                  disabled={isCurrentUser}
                />
                {isCurrentUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t.cannotChangeOwnRole}
                  </p>
                )}
              </div>

              {/* Status selector */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.status}
                </Label>
                <UserStatusSelect
                  userId={user.id}
                  currentStatus={user.status}
                  disabled={isCurrentUser}
                />
                {isCurrentUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t.cannotChangeOwnStatus}
                  </p>
                )}
              </div>

              {/* Supervisor selector */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.supervisor}
                </Label>
                <UserSupervisorSelect
                  userId={user.id}
                  currentSupervisorId={user.supervisor?.id || null}
                  potentialSupervisors={potentialSupervisors}
                />
              </div>

              {/* Company selector (only for SUPERADMIN) */}
              {isSuperAdmin && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.company}
                  </Label>
                  <UserCompanySelect
                    userId={user.id}
                    userCompanies={user.companies.map(uc => ({ companyId: uc.companyId }))}
                    companies={companies}
                    translations={{
                      noCompany: t.noCompany,
                      saving: t.saving,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {t.registeredOn} {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <Link href={`/supervisor/${user.id}/${getCurrentMonth()}`}>
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  {t.viewBigRocks}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
