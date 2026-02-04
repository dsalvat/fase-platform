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
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  SUPERVISOR: {
    label: "Supervisor",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  ADMIN: {
    label: "Administrador",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  SUPERADMIN: {
    label: "Super Admin",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

/**
 * Status display configuration
 */
export const statusConfig: Record<UserStatus, { label: string; color: string; bgColor: string }> = {
  INVITED: {
    label: "Invitado",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  ACTIVE: {
    label: "Activo",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  DEACTIVATED: {
    label: "Desactivado",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};
