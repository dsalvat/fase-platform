"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentMonth, getNextMonth, generateMonthOptions } from "@/lib/month-helpers";

interface MonthSelectorProps {
  defaultMonth?: string;
}

/**
 * Client Component for month selection
 * Updates URL search params when month changes
 */
export function MonthSelector({ defaultMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentMonth = searchParams.get("month") || defaultMonth || getCurrentMonth();

  // Generate month options (next 12 months)
  const months = generateMonthOptions(12, getCurrentMonth());

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
        Mes:
      </label>
      <Select value={currentMonth} onValueChange={handleChange}>
        <SelectTrigger id="month-select" className="w-[180px] sm:w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
