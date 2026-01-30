import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { KeyPersonForm } from "@/components/key-people";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Create Key Person page
 * Server Component that renders the Key Person creation form
 */
export default async function NewKeyPersonPage() {
  // Ensure user is authenticated
  await requireAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Link href="/key-people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Personas Clave
          </Button>
        </Link>
      </div>

      {/* Form */}
      <KeyPersonForm mode="create" />
    </div>
  );
}
