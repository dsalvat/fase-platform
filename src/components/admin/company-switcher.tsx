"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Building2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanySelectorItem } from "@/types/company";

interface CompanySwitcherProps {
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

export function CompanySwitcher({
  companies,
  currentCompanyId,
  currentCompanyName,
  currentCompanyLogo,
  isSuperAdmin = false,
  translations: t,
}: CompanySwitcherProps) {
  const { update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (companyId: string | null) => {
    setSwitching(true);
    try {
      await update({ currentCompanyId: companyId });
      setIsOpen(false);
      // Reload to apply company context
      window.location.reload();
    } catch (error) {
      console.error("Error switching company:", error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        disabled={switching}
      >
        {currentCompanyLogo ? (
          <div className="relative w-5 h-5 rounded overflow-hidden">
            <Image
              src={currentCompanyLogo}
              alt={currentCompanyName || ""}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <Building2 className="w-4 h-4" />
        )}
        <span className="max-w-[150px] truncate">
          {currentCompanyName || t.noCompanySelected}
        </span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-2 py-1">
                {t.selectCompany}
              </p>
              <div className="mt-1 max-h-60 overflow-auto">
                {/* Option for no company (global view) - only for SUPERADMIN */}
                {isSuperAdmin && (
                  <button
                    onClick={() => handleSwitch(null)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <span className="text-gray-500 italic">
                      {t.noCompanySelected}
                    </span>
                    {currentCompanyId === null && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                )}

                {/* Company options */}
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSwitch(company.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {company.logo ? (
                        <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={company.logo}
                            alt={company.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span>{company.name}</span>
                    </div>
                    {currentCompanyId === company.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
