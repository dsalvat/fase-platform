import { TAR } from "@prisma/client";
import { TARCard } from "./tar-card";

interface TARListProps {
  tars: (TAR & {
    _count?: {
      activities: number;
      keyPeople: number;
    };
  })[];
  bigRockId: string;
  isReadOnly?: boolean;
  canEdit?: boolean;
}

/**
 * List component to display TARs for a Big Rock
 * Server Component
 */
export function TARList({
  tars,
  bigRockId,
  isReadOnly = false,
  canEdit = true,
}: TARListProps) {
  if (tars.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay TARs creadas para este Big Rock.</p>
        {canEdit && !isReadOnly && (
          <p className="text-sm mt-2">
            Crea tu primera TAR para comenzar a trabajar en este objetivo.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tars.map((tar) => (
        <TARCard
          key={tar.id}
          tar={tar}
          bigRockId={bigRockId}
          isReadOnly={isReadOnly}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
