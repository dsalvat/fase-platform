"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Building2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompany } from "@/app/actions/companies";
import type { CompanyListItem } from "@/types/company";

interface EditCompanyDialogProps {
  company: CompanyListItem;
  translations: {
    edit: string;
    name: string;
    slug: string;
    logo: string;
    logoUrl: string;
    logoHelp: string;
    save: string;
    cancel: string;
    saving: string;
  };
  onClose: () => void;
}

export function EditCompanyDialog({ company, translations: t, onClose }: EditCompanyDialogProps) {
  const [name, setName] = useState(company.name);
  const [slug, setSlug] = useState(company.slug);
  const [logo, setLogo] = useState(company.logo || "");
  const [logoError, setLogoError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset logo error when URL changes
  const handleLogoChange = (value: string) => {
    setLogo(value);
    setLogoError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateCompany(company.id, {
        name,
        slug,
        logo: logo || null,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Error al actualizar");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-700" />
            </div>
            <h2 className="text-lg font-semibold">{t.edit}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Preview */}
          <div className="flex justify-center">
            {logo && !logoError ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <Image
                  src={logo}
                  alt={name}
                  fill
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">{t.slug}</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="logo">{t.logoUrl}</Label>
            <Input
              id="logo"
              type="url"
              value={logo}
              onChange={(e) => handleLogoChange(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">{t.logoHelp}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t.saving : t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
