import { ActivityLog, User, LogEntityType, LogActionType } from "@prisma/client";

/**
 * Activity log with user information
 */
export type ActivityLogWithUser = ActivityLog & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

/**
 * Display configuration for entity types
 */
export const entityTypeConfig: Record<LogEntityType, {
  label: string;
  labelPlural: string;
  color: string;
  bgColor: string;
}> = {
  BIG_ROCK: {
    label: "Big Rock",
    labelPlural: "Big Rocks",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  TAR: {
    label: "TAR",
    labelPlural: "TARs",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  ACTIVITY: {
    label: "Actividad",
    labelPlural: "Actividades",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  KEY_MEETING: {
    label: "Reunion Clave",
    labelPlural: "Reuniones Clave",
    color: "text-pink-700",
    bgColor: "bg-pink-100",
  },
};

/**
 * Display configuration for action types
 */
export const actionTypeConfig: Record<LogActionType, {
  label: string;
  verb: string;
  color: string;
  bgColor: string;
}> = {
  CREATE: {
    label: "Crear",
    verb: "creo",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  UPDATE: {
    label: "Actualizar",
    verb: "actualizo",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  DELETE: {
    label: "Eliminar",
    verb: "elimino",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

/**
 * Activity log query params
 */
export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  entityType?: LogEntityType;
  action?: LogActionType;
  userId?: string;
}

/**
 * Paginated activity logs response
 */
export interface PaginatedActivityLogs {
  logs: ActivityLogWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Viewable user for filter dropdown
 */
export interface ViewableUser {
  id: string;
  name: string | null;
  email: string;
}
