"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Users, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCompany } from "@/app/actions/companies";
import { EditCompanyDialog } from "./edit-company-dialog";
import type { CompanyListItem } from "@/types/company";

interface CompanyListProps {
  companies: CompanyListItem[];
  translations: {
    name: string;
    slug: string;
    users: string;
    deleteConfirm: string;
    noResults: string;
    edit: string;
    logo: string;
    logoUrl: string;
    logoHelp: string;
    save: string;
    cancel: string;
    saving: string;
  };
}

export function CompanyList({ companies, translations: t }: CompanyListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyListItem | null>(null);

  const handleDelete = async (companyId: string) => {
    if (!confirm(t.deleteConfirm)) return;

    setDeletingId(companyId);
    try {
      const result = await deleteCompany(companyId);
      if (!result.success) {
        alert(result.error);
      }
    } catch {
      alert("Error al eliminar la empresa");
    } finally {
      setDeletingId(null);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t.noResults}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.name}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.slug}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.users}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {company.logo ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border dark:border-gray-700">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      </div>
                    )}
                    <span className="font-medium text-foreground">{company.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {company.slug}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{company._count.userCompanies}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCompany(company)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company.id)}
                      disabled={deletingId === company.id || company._count.userCompanies > 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCompany && (
        <EditCompanyDialog
          company={editingCompany}
          translations={{
            edit: t.edit,
            name: t.name,
            slug: t.slug,
            logo: t.logo,
            logoUrl: t.logoUrl,
            logoHelp: t.logoHelp,
            save: t.save,
            cancel: t.cancel,
            saving: t.saving,
          }}
          onClose={() => setEditingCompany(null)}
        />
      )}
    </>
  );
}
