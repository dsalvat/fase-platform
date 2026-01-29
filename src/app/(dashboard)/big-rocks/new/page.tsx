import { BigRockForm } from "@/components/big-rocks/big-rock-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getNextMonth, getCurrentMonth } from "@/lib/month-helpers";

interface PageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

/**
 * Create Big Rock page
 * Server Component that renders the create form
 */
export default async function NewBigRockPage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const defaultMonth = month || getNextMonth(getCurrentMonth());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/big-rocks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Big Rocks
          </Button>
        </Link>
      </div>

      {/* Form */}
      <BigRockForm mode="create" defaultMonth={defaultMonth} />
    </div>
  );
}
