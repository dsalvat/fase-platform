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
import { UserAppSelect } from "./user-app-select";
import { UserStatus, AppType } from "@prisma/client";

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

interface App {
  id: string;
  code: AppType;
  name: string;
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
  apps: string;
  cannotChangeOwnRole: string;
  cannotChangeOwnStatus: string;
  registeredOn: string;
  edit: string;
  close: string;
  noCompany: string;
  noApp: string;
  saving: string;
  viewBigRocks: string;
}

interface UserListProps {
  users: UserListItem[];
  allUsers: { id: string; name: string | null; email: string; companyIds: string[] }[];
  currentUserId: string;
  companies?: Company[];
  apps?: App[];
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
  apps: "Aplicaciones",
  cannotChangeOwnRole: "No puedes cambiar tu propio rol",
  cannotChangeOwnStatus: "No puedes cambiar tu propio estado",
  registeredOn: "Registrado el",
  edit: "Editar",
  close: "Cerrar",
  noCompany: "Sin empresa",
  noApp: "Sin aplicaciones",
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
  apps = [],
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hideDeactivated}
              onChange={(e) => setHideDeactivated(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span>{t.hideDeactivated}</span>
          </label>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
          {formatShowingUsers(t.showingUsersTemplate, filteredUsers.length, users.length)}
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
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
            apps={apps}
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
  allUsers: { id: string; name: string | null; email: string; companyIds: string[] }[];
  isCurrentUser: boolean;
  companies: Company[];
  apps: App[];
  isSuperAdmin: boolean;
  translations: UserListTranslations;
}

function UserCard({
  user,
  allUsers,
  isCurrentUser,
  companies,
  apps,
  isSuperAdmin,
  translations: t,
}: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const roleInfo = roleConfig[user.role];
  const statusInfo = statusConfig[user.status];
  const RoleIcon = roleIcons[user.role];

  // Get potential supervisors filtered by company (can't supervise themselves)
  const getSupervisorsForCompany = (companyId: string) =>
    allUsers.filter((u) => u.id !== user.id && u.companyIds.includes(companyId));

  return (
    <Card className={cn(
      isCurrentUser && "border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/20",
      user.status === UserStatus.DEACTIVATED && "opacity-60"
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Avatar and basic info row on mobile */}
          <div className="flex items-start gap-3 sm:contents">
          {/* Avatar */}
          <div className="shrink-0 relative">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || ""}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            {/* Status indicator dot */}
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
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
              <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {user.name || t.noName}
              </h3>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded shrink-0">
                  {t.you}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
              {/* Role badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium",
                  roleInfo.bgColor,
                  roleInfo.color
                )}
              >
                <RoleIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{roleInfo.label}</span>
              </span>

              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium",
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                {statusInfo.label}
              </span>

              {/* Company badge - hidden on mobile */}
              {user.company && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
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

              {/* Supervisor info - hidden on mobile */}
              {user.supervisor && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {t.supervisor}: {user.supervisor.name || user.supervisor.email}
                </span>
              )}

              {/* Supervisees count - hidden on mobile */}
              {user._count.supervisees > 0 && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {user._count.supervisees} supervisado(s)
                </span>
              )}
            </div>
          </div>
          </div>

          {/* Actions - full width on mobile */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:shrink-0">
            <Link href={`/supervisor/${user.id}/${getCurrentMonth()}`} className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Target className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t.viewBigRocks}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 sm:flex-initial"
            >
              {isExpanded ? t.close : t.edit}
            </Button>
          </div>
        </div>

        {/* Expanded edit section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Status selector (global) */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">
                  {t.status}
                </Label>
                <UserStatusSelect
                  userId={user.id}
                  currentStatus={user.status}
                  disabled={isCurrentUser}
                />
                {isCurrentUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.cannotChangeOwnStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Per-company role and supervisor */}
            <div className="space-y-2">
              {user.companies.map((uc) => (
                <div
                  key={uc.companyId}
                  className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3 p-3 rounded-lg bg-muted/40 border border-border/50"
                >
                  {/* Company name */}
                  <div className="flex items-center gap-1.5 sm:w-40 shrink-0">
                    {uc.company.logo ? (
                      <div className="relative w-4 h-4 rounded overflow-hidden shrink-0">
                        <Image
                          src={uc.company.logo}
                          alt={uc.company.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium truncate">{uc.company.name}</span>
                  </div>

                  {/* Role selector */}
                  <div className="flex-1 min-w-0">
                    <Label className="block text-xs text-muted-foreground mb-1">
                      {t.role}
                    </Label>
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={uc.role}
                      companyId={uc.companyId}
                      disabled={isCurrentUser}
                    />
                  </div>

                  {/* Supervisor selector */}
                  <div className="flex-1 min-w-0">
                    <Label className="block text-xs text-muted-foreground mb-1">
                      {t.supervisor}
                    </Label>
                    <UserSupervisorSelect
                      userId={user.id}
                      currentSupervisorId={uc.supervisorId}
                      companyId={uc.companyId}
                      potentialSupervisors={getSupervisorsForCompany(uc.companyId)}
                    />
                  </div>
                </div>
              ))}

              {/* Add company (SUPERADMIN only) */}
              {isSuperAdmin && (
                <div className="pt-1">
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

            {isCurrentUser && (
              <p className="text-xs text-muted-foreground">
                {t.cannotChangeOwnRole}
              </p>
            )}

            {/* Apps selector */}
            {apps.length > 0 && (
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">
                  {t.apps}
                </Label>
                <UserAppSelect
                  userId={user.id}
                  userApps={user.apps?.map(ua => ({ appId: ua.appId })) || []}
                  apps={apps}
                  translations={{
                    noApp: t.noApp,
                    saving: t.saving,
                  }}
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {t.registeredOn} {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
