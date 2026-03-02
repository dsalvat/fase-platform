"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentMonth, generateMonthOptions, generatePastMonthOptions } from "@/lib/month-helpers";
import { Lock } from "lucide-react";

interface MonthSelectorProps {
  defaultMonth?: string;
  pastMonthsCount?: number;
  translations?: {
    label: string;
    pastMonths: string;
    currentAndFuture: string;
    readOnly: string;
  };
}

/**
 * Client Component for month selection
 * Updates URL search params when month changes
 * Shows past months (read-only) and current/future months
 */
export function MonthSelector({ defaultMonth, pastMonthsCount = 6, translations }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentMonth = searchParams.get("month") || defaultMonth || getCurrentMonth();

  // Generate month options: current + 12 future
  const futureMonths = generateMonthOptions(12, getCurrentMonth());
  // Generate past months (most recent first)
  const pastMonths = generatePastMonthOptions(pastMonthsCount);

  const labelText = translations?.label ?? "Mes:";
  const pastLabel = translations?.pastMonths ?? "Mesos anteriors";
  const currentLabel = translations?.currentAndFuture ?? "Actual i futurs";
  const readOnlyLabel = translations?.readOnly ?? "només lectura";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {labelText}
      </label>
      <Select value={currentMonth} onValueChange={handleChange}>
        <SelectTrigger id="month-select" className="w-[200px] sm:w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">{currentLabel}</SelectLabel>
            {futureMonths.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectGroup>
          {pastMonths.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">{pastLabel}</SelectLabel>
              {pastMonths.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{month.label}</span>
                    <span className="text-xs text-muted-foreground">({readOnlyLabel})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
