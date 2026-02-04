import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BigRockCard } from "./big-rock-card";
import { isMonthReadOnly } from "@/lib/month-helpers";

interface BigRockListProps {
  month?: string;
  userId?: string; // For supervisor/admin view
}

/**
 * Server Component to fetch and display Big Rocks
 * Fetches data directly from Prisma and renders cards
 */
export async function BigRockList({ month, userId }: BigRockListProps) {
  const currentUser = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (currentUser as any).role;

  // Determine target user
  const targetUserId = userId || currentUser.id;

  // Authorization check for viewing other users
  if (targetUserId !== currentUser.id) {
    if (userRole === "USER") {
      throw new Error("No tienes permiso para ver Big Rocks de otros usuarios");
    }

    if (userRole === "SUPERVISOR") {
      const supervised = await prisma.user.findFirst({
        where: { id: targetUserId, supervisorId: currentUser.id },
      });

      if (!supervised) {
        throw new Error("No tienes permiso para ver Big Rocks de este usuario");
      }
    }
    // ADMIN can view any user
  }

  // Fetch Big Rocks
  const bigRocks = await prisma.bigRock.findMany({
    where: {
      userId: targetUserId,
      ...(month && { month }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      tars: {
        select: {
          id: true,
          status: true,
          progress: true,
        },
      },
      _count: {
        select: {
          keyMeetings: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const isReadOnly = month ? isMonthReadOnly(month) : false;
  const canEdit = targetUserId === currentUser.id;

  // Empty state
  if (bigRocks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay Big Rocks
        </h3>
        <p className="text-gray-500">
          {month
            ? `No hay Big Rocks planificados para este mes.`
            : `Empieza creando tu primer Big Rock.`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bigRocks.map((bigRock, index) => (
        <div key={bigRock.id} data-tour={index === 0 ? "big-rock-card" : undefined}>
          <BigRockCard
            bigRock={bigRock}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
          />
        </div>
      ))}
    </div>
  );
}
