import Link from "next/link";
import { KeyPerson } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Mail, Phone, Briefcase } from "lucide-react";

interface KeyPersonCardProps {
  keyPerson: KeyPerson & {
    _count?: {
      bigRocks: number;
    };
  };
}

/**
 * Card component to display a Key Person in list views
 * Server Component - renders static content with links
 */
export function KeyPersonCard({ keyPerson }: KeyPersonCardProps) {
  const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;

  // Determine contact type for icon
  const isEmail = keyPerson.contact?.includes("@");

  return (
    <Link href={`/key-people/${keyPerson.id}`} className="block group">
      <Card
        className={cn(
          "transition-all hover:shadow-md hover:border-blue-300"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar placeholder */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {fullName}
              </p>

              {keyPerson.role && (
                <div className="flex items-center gap-1 mt-1">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {keyPerson.role}
                  </span>
                </div>
              )}

              {keyPerson.contact && (
                <div className="flex items-center gap-1 mt-1">
                  {isEmail ? (
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Phone className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {keyPerson.contact}
                  </span>
                </div>
              )}

              {keyPerson._count && keyPerson._count.bigRocks > 0 && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {keyPerson._count.bigRocks} Big Rock
                    {keyPerson._count.bigRocks !== 1 ? "s" : ""} vinculados
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
