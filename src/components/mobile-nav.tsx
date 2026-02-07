"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home, Target, Calendar, BarChart3, Users, Flag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { AppType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  currentAppCode: AppType;
  userApps?: { code: string }[];
  translations: {
    menu: string;
    home: string;
    bigRocks: string;
    calendar: string;
    dashboard: string;
    objectives: string;
    teams: string;
    quarters: string;
  };
  isAdmin?: boolean;
  isSupervisor?: boolean;
  adminLabel?: string;
  supervisorLabel?: string;
}

export function MobileNav({
  currentAppCode,
  userApps,
  translations,
  isAdmin,
  isSupervisor,
  adminLabel,
  supervisorLabel,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const faseLinks = [
    { href: "/home", label: translations.home, icon: Home },
    { href: "/big-rocks", label: translations.bigRocks, icon: Target },
    { href: "/calendario", label: translations.calendar, icon: Calendar },
  ];

  const okrLinks = [
    { href: "/okr", label: translations.dashboard, icon: BarChart3 },
    { href: "/okr/objetivos", label: translations.objectives, icon: Flag },
    { href: "/okr/equipos", label: translations.teams, icon: Users },
    { href: "/okr/trimestres", label: translations.quarters, icon: Calendar },
  ];

  // Determine which app link sets to show
  const hasFase = userApps?.some(a => a.code === AppType.FASE);
  const hasOkr = userApps?.some(a => a.code === AppType.OKR);
  const hasBothApps = hasFase && hasOkr;

  // If no userApps provided, fall back to the old behavior (current app only)
  const showFase = hasBothApps || (!userApps && currentAppCode === AppType.FASE) || (userApps && hasFase && !hasOkr);
  const showOkr = hasBothApps || (!userApps && currentAppCode === AppType.OKR) || (userApps && hasOkr && !hasFase);

  const additionalLinks = [];
  if (isSupervisor) {
    additionalLinks.push({
      href: "/supervisor",
      label: supervisorLabel || "Supervisor",
      icon: Users,
    });
  }
  if (isAdmin) {
    additionalLinks.push({
      href: "/admin/usuarios",
      label: adminLabel || "Admin",
      icon: Settings,
    });
  }

  const renderLinks = (links: typeof faseLinks) => {
    return links.map((link) => {
      const Icon = link.icon;
      const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
      return (
        <SheetClose asChild key={link.href}>
          <Link
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {link.label}
          </Link>
        </SheetClose>
      );
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{translations.menu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 sm:w-72 pt-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left">
            {currentAppCode === AppType.OKR ? "OKR" : "FASE"}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2">
          {showFase && (
            <>
              {hasBothApps && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">FASE</p>
              )}
              {renderLinks(faseLinks)}
            </>
          )}

          {showFase && showOkr && (
            <div className="my-2 border-t" />
          )}

          {showOkr && (
            <>
              {hasBothApps && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">OKR</p>
              )}
              {renderLinks(okrLinks)}
            </>
          )}

          {additionalLinks.length > 0 && (
            <>
              <div className="my-2 border-t" />
              {additionalLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
