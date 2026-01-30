"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Building2, Loader2, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addUserToCompany, removeUserFromCompany } from "@/app/actions/users";

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

interface UserCompanySelectProps {
  userId: string;
  userCompanies: { companyId: string }[];
  companies: Company[];
  disabled?: boolean;
  translations: {
    noCompany: string;
    saving: string;
    addCompany?: string;
  };
}

export function UserCompanySelect({
  userId,
  userCompanies,
  companies,
  disabled = false,
  translations: t,
}: UserCompanySelectProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get IDs of companies user already belongs to
  const userCompanyIds = new Set(userCompanies.map((uc) => uc.companyId));

  // Filter to show only companies user is part of
  const currentCompanies = companies.filter((c) => userCompanyIds.has(c.id));

  // Filter to show available companies to add
  const availableCompanies = companies.filter((c) => !userCompanyIds.has(c.id));

  const handleAddCompany = (companyId: string) => {
    setError(null);
    setShowDropdown(false);
    startTransition(async () => {
      const result = await addUserToCompany(userId, companyId);
      if (!result.success) {
        setError(result.error || "Error al agregar empresa");
      }
    });
  };

  const handleRemoveCompany = (companyId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeUserFromCompany(userId, companyId);
      if (!result.success) {
        setError(result.error || "Error al eliminar empresa");
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
      {/* Current companies */}
      {currentCompanies.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t.noCompany}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {currentCompanies.map((company) => (
            <div
              key={company.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {company.logo ? (
                <div className="relative w-4 h-4 rounded overflow-hidden flex-shrink-0">
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
              {currentCompanies.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCompany(company.id)}
                  disabled={disabled}
                  className="ml-1 hover:text-red-600"
                  title="Quitar de empresa"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add company dropdown */}
      {availableCompanies.length > 0 && !disabled && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Plus className="w-3 h-3 mr-1" />
            {t.addCompany || "Agregar empresa"}
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
                {availableCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleAddCompany(company.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm"
                  >
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
                      <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span>{company.name}</span>
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
