import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeaderboardEntry } from "@/types/gamification";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking</CardTitle>
          <CardDescription>
            Aun no hay usuarios en el ranking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Se el primero en aparecer completando actividades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ranking</CardTitle>
        <CardDescription>Top usuarios por engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        isCurrentUser ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
      }`}
    >
      {/* Rank */}
      <div className="w-8 h-8 flex items-center justify-center">
        {entry.rank <= 3 ? (
          <span className="text-2xl">{getRankMedal(entry.rank)}</span>
        ) : (
          <span className="text-lg font-bold text-gray-400">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
        {entry.userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.userImage}
            alt={entry.userName}
            className="w-full h-full object-cover"
          />
        ) : (
          entry.userName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name and level */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {entry.userName}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-blue-600">(Tu)</span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          Nivel {entry.level} - {entry.medalCount} medallas
        </p>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="font-bold text-blue-600">{entry.points.toLocaleString()}</p>
        <p className="text-xs text-gray-500">puntos</p>
      </div>
    </div>
  );
}

function getRankMedal(rank: number): string {
  const medals: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };
  return medals[rank] || "";
}
