"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompany } from "@/app/actions/companies";
import { generateSlug } from "@/lib/validations/company";

interface CreateCompanyDialogProps {
  translations: {
    new: string;
    name: string;
    slug: string;
    slugHelp: string;
    cancel: string;
    create: string;
    loading: string;
  };
}

function SubmitButton({ translations }: { translations: { loading: string; create: string } }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? translations.loading : translations.create}
    </Button>
  );
}

export function CreateCompanyDialog({ translations: t }: CreateCompanyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [state, formAction] = useActionState(createCompany, { success: false });

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      setSlug(generateSlug(name));
    } else {
      setSlug("");
    }
  }, [name]);

  // Close dialog on success
  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      setName("");
      setSlug("");
    }
  }, [state.success]);

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        {t.new}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-700" />
            </div>
            <h2 className="text-lg font-semibold">{t.new}</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Empresa S.L."
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">{t.slug}</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mi-empresa"
            />
            <p className="text-xs text-gray-500 mt-1">{t.slugHelp}</p>
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t.cancel}
            </Button>
            <SubmitButton translations={{ loading: t.loading, create: t.create }} />
          </div>
        </form>
      </div>
    </div>
  );
}
