"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
  };
  translations: {
    name: string;
    namePlaceholder: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
}

export function ProfileForm({
  user,
  translations: t,
}: ProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateProfile({
        name: name || null,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMessage(result.error || t.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t.name}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          disabled={isPending}
        />
      </div>

      {/* Error message */}
      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
        {status === "success" && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            {t.saved}
          </span>
        )}
      </div>
    </form>
  );
}
