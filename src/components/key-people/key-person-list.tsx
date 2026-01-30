import { KeyPerson } from "@prisma/client";
import { KeyPersonCard } from "./key-person-card";

interface KeyPersonListProps {
  keyPeople: (KeyPerson & {
    _count?: {
      bigRocks: number;
    };
  })[];
}

/**
 * List component to display Key People
 * Server Component
 */
export function KeyPersonList({ keyPeople }: KeyPersonListProps) {
  if (keyPeople.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tienes personas clave registradas.</p>
        <p className="text-sm mt-2">
          Agrega las personas que te ayudaran a lograr tus objetivos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {keyPeople.map((keyPerson) => (
        <KeyPersonCard key={keyPerson.id} keyPerson={keyPerson} />
      ))}
    </div>
  );
}
