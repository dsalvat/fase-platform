"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, localeFlags, Locale } from "@/i18n/config";
import { setUserLanguage } from "@/app/actions/language";
import { Globe, Loader2 } from "lucide-react";

interface LanguageSelectorProps {
  currentLocale: string;
  userId?: string;
}

export function LanguageSelector({ currentLocale, userId }: LanguageSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (locale: string) => {
    startTransition(async () => {
      // Set cookie for immediate effect
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;

      // If user is logged in, save preference to database
      if (userId) {
        await setUserLanguage(locale as Locale);
      }

      // Refresh the page to apply the new locale
      router.refresh();
    });
  };

  return (
    <Select value={currentLocale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[140px] h-9">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <SelectValue />
          </div>
        )}
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
