"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppType } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Target, BarChart3, Check } from "lucide-react";
import { switchCurrentApp } from "@/app/actions/apps";

const APP_ICONS: Record<AppType, React.ReactNode> = {
  FASE: <Target className="h-4 w-4" />,
  OKR: <BarChart3 className="h-4 w-4" />,
};

const APP_ROUTES: Record<AppType, string> = {
  FASE: "/big-rocks",
  OKR: "/okr",
};

interface AppInfo {
  id: string;
  code: AppType;
  name: string;
}

interface AppSwitcherProps {
  apps: AppInfo[];
  currentAppId: string | null;
  translations?: {
    switchApp?: string;
  };
}

export function AppSwitcher({ apps, currentAppId, translations }: AppSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Don't render if user has only one app or no apps
  if (!apps || apps.length <= 1) {
    return null;
  }

  const currentApp = apps.find((app) => app.id === currentAppId);

  const handleSwitchApp = async (appId: string, appCode: AppType) => {
    startTransition(async () => {
      const result = await switchCurrentApp(appId);
      if (result.success) {
        // Navigate to the app's main page and refresh to get new session data
        router.push(APP_ROUTES[appCode]);
        router.refresh();
      }
      setOpen(false);
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          {currentApp && APP_ICONS[currentApp.code]}
          <span className="hidden sm:inline">{currentApp?.name || "App"}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {translations?.switchApp || "Cambiar aplicación"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {apps.map((app) => (
          <DropdownMenuItem
            key={app.id}
            onClick={() => handleSwitchApp(app.id, app.code)}
            className="cursor-pointer"
            disabled={isPending}
          >
            <div className="flex items-center gap-2 flex-1">
              {APP_ICONS[app.code]}
              <span>{app.name}</span>
            </div>
            {app.id === currentAppId && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
