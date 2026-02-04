"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuarterPeriod } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { activateQuarter } from "@/app/actions/okr";

const QUARTERS: { value: QuarterPeriod; label: string; months: string }[] = [
  { value: "Q1", label: "Q1 - Primer Trimestre", months: "Enero - Marzo" },
  { value: "Q2", label: "Q2 - Segundo Trimestre", months: "Abril - Junio" },
  { value: "Q3", label: "Q3 - Tercer Trimestre", months: "Julio - Septiembre" },
  { value: "Q4", label: "Q4 - Cuarto Trimestre", months: "Octubre - Diciembre" },
];

export default function ActivateQuarterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriod | null>(null);

  // Suggest current quarter
  const currentMonth = new Date().getMonth();
  const suggestedQuarter = `Q${Math.floor(currentMonth / 3) + 1}` as QuarterPeriod;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedQuarter) {
      setError("Selecciona un trimestre");
      return;
    }

    startTransition(async () => {
      const result = await activateQuarter({
        year: selectedYear,
        quarter: selectedQuarter,
      });

      if (result.success) {
        router.push("/okr/trimestres");
      } else {
        setError(result.error || "Error al activar el trimestre");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/okr/trimestres">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activar Trimestre</h1>
          <p className="text-muted-foreground">
            Selecciona el trimestre para trabajar con OKRs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurar Trimestre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Selecciona el año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quarter Selection */}
            <div className="space-y-2">
              <Label>Trimestre</Label>
              <div className="grid grid-cols-2 gap-3">
                {QUARTERS.map((quarter) => (
                  <button
                    key={quarter.value}
                    type="button"
                    onClick={() => setSelectedQuarter(quarter.value)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedQuarter === quarter.value
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "hover:border-gray-300 hover:bg-gray-50"
                    } ${
                      quarter.value === suggestedQuarter && !selectedQuarter
                        ? "border-amber-200 bg-amber-50"
                        : ""
                    }`}
                  >
                    <div className="font-medium">{quarter.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {quarter.months}
                    </div>
                    {quarter.value === suggestedQuarter && !selectedQuarter && (
                      <div className="text-xs text-amber-600 mt-1">
                        Trimestre actual
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Al activar un trimestre, se desactivarán
                los demás trimestres. Solo puede haber un trimestre activo a la vez.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link href="/okr/trimestres">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isPending || !selectedQuarter}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activando...
                  </>
                ) : (
                  "Activar Trimestre"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
