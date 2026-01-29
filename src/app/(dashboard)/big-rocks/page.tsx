import { Suspense } from "react";
import Link from "next/link";
import { BigRockList } from "@/components/big-rocks/big-rock-list";
import { MonthSelector } from "@/components/big-rocks/month-selector";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getNextMonth, getCurrentMonth, isMonthReadOnly } from "@/lib/month-helpers";

interface PageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

/**
 * Big Rocks list page with month filtering
 * Server Component that renders the list of Big Rocks
 */
export default async function BigRocksPage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const defaultMonth = getNextMonth(getCurrentMonth());
  const displayMonth = month || defaultMonth;
  const isReadOnly = isMonthReadOnly(displayMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Big Rocks</h1>
          <p className="text-gray-600 mt-1">
            Tus objetivos mensuales siguiendo la metodología FASE
          </p>
        </div>

        {!isReadOnly && (
          <Link href={`/big-rocks/new?month=${displayMonth}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Big Rock
            </Button>
          </Link>
        )}
      </div>

      {/* Month selector and read-only banner */}
      <div className="flex flex-col gap-4">
        <MonthSelector defaultMonth={defaultMonth} />

        {isReadOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Este mes es de solo lectura
                </p>
                <p className="text-xs text-yellow-700">
                  No puedes crear, editar o eliminar Big Rocks de meses pasados.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Big Rocks list */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando Big Rocks...</span>
          </div>
        }
      >
        <BigRockList month={displayMonth} />
      </Suspense>
    </div>
  );
}
