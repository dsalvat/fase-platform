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
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{t.noResults}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.name}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.slug}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.users}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {company.logo ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-700" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{company.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {company.slug}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-gray-600">
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
