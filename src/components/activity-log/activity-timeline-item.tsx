"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityLogWithUser } from "@/types/activity-log";
import { entityTypeConfig, actionTypeConfig } from "@/types/activity-log";

interface ActivityTimelineItemProps {
  log: ActivityLogWithUser;
}

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

export function ActivityTimelineItem({ log }: ActivityTimelineItemProps) {
  const entityConfig = entityTypeConfig[log.entityType];
  const actionConfig = actionTypeConfig[log.action];
  const ActionIcon = actionIcons[log.action];

  const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          actionConfig.bgColor
        )}
      >
        <ActionIcon className={cn("w-5 h-5", actionConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow">
            {/* User info */}
            <div className="flex items-center gap-2 mb-1">
              {log.user.image ? (
                <Image
                  src={log.user.image}
                  alt={log.user.name || ""}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium text-sm text-gray-900">
                {log.user.name || log.user.email}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700">{log.description}</p>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  entityConfig.bgColor,
                  entityConfig.color
                )}
              >
                {entityConfig.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  actionConfig.bgColor,
                  actionConfig.color
                )}
              >
                {actionConfig.label}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <span className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}
