import { User, UserRole, UserStatus, AppType } from "@prisma/client";

/**
 * User with supervisor info
 */
export type UserWithSupervisor = User & {
  supervisor: Pick<User, 'id' | 'name' | 'email'> | null;
};

/**
 * User for list views
 */
export type UserListItem = Pick<User, 'id' | 'email' | 'name' | 'image' | 'role' | 'status' | 'createdAt'> & {
  currentCompanyId: string | null;
  supervisor: Pick<User, 'id' | 'name' | 'email'> | null;
  company: { id: string; name: string; logo: string | null } | null; // First/current company for display
  companies: { companyId: string; company: { id: string; name: string; logo: string | null } }[]; // All companies via UserCompany
  apps?: { appId: string; app: { id: string; code: AppType; name: string } }[]; // All apps via UserApp
  _count: {
    supervisees: number;
  };
};

/**
 * Paginated users response
 */
export interface PaginatedUsers {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Role display configuration
 */
export const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  USER: {
    label: "Usuario",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  SUPERVISOR: {
    label: "Supervisor",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
  },
  ADMIN: {
    label: "Administrador",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
  },
  SUPERADMIN: {
    label: "Super Admin",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/50",
  },
};

/**
 * Status display configuration
 */
export const statusConfig: Record<UserStatus, { label: string; color: string; bgColor: string }> = {
  INVITED: {
    label: "Invitado",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/50",
  },
  ACTIVE: {
    label: "Activo",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/50",
  },
  DEACTIVATED: {
    label: "Desactivado",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/50",
  },
};
