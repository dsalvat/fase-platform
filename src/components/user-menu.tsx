"use client";

import Link from "next/link";
import Image from "next/image";
import { User, LogOut, ChevronDown, Shield, Users, Activity, Trophy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserApp {
  id: string;
  code: string;
  name: string;
}

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  translations: {
    myProfile: string;
    signOut: string;
    admin?: string;
    supervisor?: string;
    activity?: string;
    achievements?: string;
  };
  isAdmin?: boolean;
  isSupervisor?: boolean;
  showActivity?: boolean;
  userApps?: UserApp[];
}

export function UserMenu({ user, translations, isAdmin, isSupervisor, showActivity, userApps = [] }: UserMenuProps) {
  const showAchievements = userApps.length > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || ""}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-foreground">{user.name || "Usuario"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            {translations.myProfile}
          </Link>
        </DropdownMenuItem>
        {showActivity && (
          <DropdownMenuItem asChild>
            <Link href="/actividad" className="flex items-center gap-2 cursor-pointer">
              <Activity className="h-4 w-4" />
              {translations.activity || "Actividad"}
            </Link>
          </DropdownMenuItem>
        )}
        {showAchievements && (
          <DropdownMenuItem asChild>
            <Link href="/logros" className="flex items-center gap-2 cursor-pointer text-amber-600">
              <Trophy className="h-4 w-4" />
              {translations.achievements || "Logros"}
            </Link>
          </DropdownMenuItem>
        )}
        {isSupervisor && (
          <DropdownMenuItem asChild>
            <Link href="/supervisor" className="flex items-center gap-2 cursor-pointer text-teal-600">
              <Users className="h-4 w-4" />
              {translations.supervisor || "Supervisor"}
            </Link>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin/usuarios" className="flex items-center gap-2 cursor-pointer text-purple-600">
              <Shield className="h-4 w-4" />
              {translations.admin || "Admin"}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/auth/signout" className="flex items-center gap-2 cursor-pointer text-red-600">
            <LogOut className="h-4 w-4" />
            {translations.signOut}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
