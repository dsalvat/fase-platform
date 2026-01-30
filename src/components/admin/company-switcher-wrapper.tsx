"use client";

import { SessionProvider } from "next-auth/react";
import { CompanySwitcher } from "./company-switcher";
import type { CompanySelectorItem } from "@/types/company";

interface CompanySwitcherWrapperProps {
  companies: CompanySelectorItem[];
  currentCompanyId: string | null;
  currentCompanyName?: string;
  currentCompanyLogo?: string | null;
  isSuperAdmin?: boolean;
  translations: {
    noCompanySelected: string;
    selectCompany: string;
  };
}

export function CompanySwitcherWrapper(props: CompanySwitcherWrapperProps) {
  return (
    <SessionProvider>
      <CompanySwitcher {...props} />
    </SessionProvider>
  );
}
