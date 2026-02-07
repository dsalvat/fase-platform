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

  const links = currentAppCode === AppType.OKR ? okrLinks : faseLinks;

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
          {links.map((link) => {
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
          })}

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
