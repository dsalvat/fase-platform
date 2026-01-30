import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessKeyPerson, canModifyKeyPerson } from "@/lib/auth";
import { KeyPersonDeleteButton } from "@/components/key-people";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, User, Briefcase, Mail, Phone } from "lucide-react";

interface PageProps {
  params: Promise<{
    personId: string;
  }>;
}

/**
 * Key Person detail page
 * Server Component that fetches and displays full Key Person details
 */
export default async function KeyPersonDetailPage({ params }: PageProps) {
  const { personId } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  // Check access permissions
  const hasAccess = await canAccessKeyPerson(personId, user.id, userRole);
  if (!hasAccess) {
    notFound();
  }

  // Fetch Key Person with full details
  const keyPerson = await prisma.keyPerson.findUnique({
    where: { id: personId },
    include: {
      bigRocks: {
        select: {
          id: true,
          title: true,
          status: true,
          month: true,
        },
      },
    },
  });

  if (!keyPerson) {
    notFound();
  }

  const canModify = await canModifyKeyPerson(personId, user.id, userRole);
  const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;

  // Determine contact type
  const isEmail = keyPerson.contact?.includes("@");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Link href="/key-people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Personas Clave
          </Button>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link href={`/key-people/${personId}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <KeyPersonDeleteButton
              keyPersonId={personId}
              keyPersonName={fullName}
            />
          </div>
        )}
      </div>

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{fullName}</CardTitle>
              {keyPerson.role && (
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{keyPerson.role}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contact */}
          {keyPerson.contact && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contacto</h3>
              <div className="flex items-center gap-2 text-gray-700">
                {isEmail ? (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Phone className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{keyPerson.contact}</span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Vinculada a</p>
              <p className="font-medium">
                {keyPerson.bigRocks.length} Big Rock{keyPerson.bigRocks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Creada</p>
              <p className="font-medium">
                {new Date(keyPerson.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Big Rocks section */}
      {keyPerson.bigRocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Big Rocks Vinculados ({keyPerson.bigRocks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyPerson.bigRocks.map((bigRock) => (
                <Link
                  key={bigRock.id}
                  href={`/big-rocks/${bigRock.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {bigRock.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <span>{bigRock.month}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        bigRock.status === "FINALIZADO"
                          ? "bg-green-100 text-green-700"
                          : bigRock.status === "EN_PROGRESO"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {bigRock.status === "FINALIZADO"
                        ? "Finalizado"
                        : bigRock.status === "EN_PROGRESO"
                        ? "En Progreso"
                        : "Planificado"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {keyPerson.bigRocks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Esta persona clave no esta vinculada a ningun Big Rock.</p>
            <p className="text-sm mt-1">
              Puedes vincularla desde la pagina de edicion de un Big Rock.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
