import { User, UserRole } from "@prisma/client";

/**
 * User with supervisor info
 */
export type UserWithSupervisor = User & {
  supervisor: Pick<User, 'id' | 'name' | 'email'> | null;
};

/**
 * User for list views
 */
export type UserListItem = Pick<User, 'id' | 'email' | 'name' | 'image' | 'role' | 'createdAt'> & {
  supervisor: Pick<User, 'id' | 'name' | 'email'> | null;
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
};
