"use client";

import { useState, useTransition } from "react";
import { Target, BarChart3, Loader2, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addUserToApp, removeUserFromApp } from "@/app/actions/users";
import { AppType } from "@prisma/client";

interface App {
  id: string;
  code: AppType;
  name: string;
}

const APP_ICONS: Record<AppType, React.ReactNode> = {
  FASE: <Target className="w-4 h-4 text-blue-600" />,
  OKR: <BarChart3 className="w-4 h-4 text-purple-600" />,
};

interface UserAppSelectProps {
  userId: string;
  userApps: { appId: string }[];
  apps: App[];
  disabled?: boolean;
  translations: {
    noApp: string;
    saving: string;
    addApp?: string;
  };
}

export function UserAppSelect({
  userId,
  userApps,
  apps,
  disabled = false,
  translations: t,
}: UserAppSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get IDs of apps user already has
  const userAppIds = new Set(userApps.map((ua) => ua.appId));

  // Filter to show only apps user has access to
  const currentApps = apps.filter((a) => userAppIds.has(a.id));

  // Filter to show available apps to add
  const availableApps = apps.filter((a) => !userAppIds.has(a.id));

  const handleAddApp = (appId: string) => {
    setError(null);
    setShowDropdown(false);
    startTransition(async () => {
      const result = await addUserToApp(userId, appId);
      if (!result.success) {
        setError(result.error || "Error al agregar aplicación");
      }
    });
  };

  const handleRemoveApp = (appId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeUserFromApp(userId, appId);
      if (!result.success) {
        setError(result.error || "Error al eliminar aplicación");
      }
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t.saving}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Current apps */}
      {currentApps.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t.noApp}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {currentApps.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {APP_ICONS[app.code]}
              <span>{app.name}</span>
              {currentApps.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveApp(app.id)}
                  disabled={disabled}
                  className="ml-1 hover:text-red-600"
                  title="Quitar aplicación"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add app dropdown */}
      {availableApps.length > 0 && !disabled && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Plus className="w-3 h-3 mr-1" />
            {t.addApp || "Agregar app"}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>

          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              {/* Dropdown menu */}
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border rounded-md shadow-lg min-w-[200px] py-1">
                {availableApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleAddApp(app.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm"
                  >
                    {APP_ICONS[app.code]}
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
