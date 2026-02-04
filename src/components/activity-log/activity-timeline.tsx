"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LogEntityType, LogActionType, UserRole } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { ActivityTimelineItem } from "./activity-timeline-item";
import { ActivityLogFilters } from "./activity-log-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ActivityLogWithUser,
  PaginatedActivityLogs,
  ViewableUser,
} from "@/types/activity-log";

interface ActivityTimelineProps {
  initialData: PaginatedActivityLogs;
  initialViewableUsers: ViewableUser[];
  userRole: UserRole;
}

export function ActivityTimeline({
  initialData,
  initialViewableUsers,
  userRole,
}: ActivityTimelineProps) {
  const [logs, setLogs] = useState<ActivityLogWithUser[]>(initialData.logs);
  const [page, setPage] = useState(initialData.pagination.page);
  const [hasMore, setHasMore] = useState(initialData.pagination.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState<LogEntityType | null>(null);
  const [action, setAction] = useState<LogActionType | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const showUserFilter = userRole === "ADMIN" || userRole === "SUPERVISOR";

  // Fetch logs with current filters
  const fetchLogs = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", pageNum.toString());
        params.set("limit", "20");
        if (entityType) params.set("entityType", entityType);
        if (action) params.set("action", action);
        if (userId) params.set("userId", userId);

        const response = await fetch(`/api/activity-logs?${params.toString()}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Error al cargar los registros");
        }

        const result: PaginatedActivityLogs = data.data;

        if (reset) {
          setLogs(result.logs);
        } else {
          setLogs((prev) => [...prev, ...result.logs]);
        }

        setPage(result.pagination.page);
        setHasMore(result.pagination.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    },
    [entityType, action, userId]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    fetchLogs(1, true);
  }, [entityType, action, userId, fetchLogs]);

  // Load more when scrolling
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchLogs(page + 1, false);
    }
  }, [isLoading, hasMore, page, fetchLogs]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  const handleClearFilters = () => {
    setEntityType(null);
    setAction(null);
    setUserId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ActivityLogFilters
        entityType={entityType}
        action={action}
        userId={userId}
        viewableUsers={initialViewableUsers}
        showUserFilter={showUserFilter}
        onEntityTypeChange={setEntityType}
        onActionChange={setAction}
        onUserIdChange={setUserId}
        onClearFilters={handleClearFilters}
      />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registro de Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
              {error}
            </div>
          )}

          {logs.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay actividades registradas
              {(entityType || action || userId) && " con los filtros seleccionados"}
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <ActivityTimelineItem key={log.id} log={log} />
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Load more trigger element */}
          {hasMore && !isLoading && (
            <div ref={loadMoreRef} className="h-4" />
          )}

          {/* End of list indicator */}
          {!hasMore && logs.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No hay mas registros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
