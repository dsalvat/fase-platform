import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  return (
    <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
      <CardHeader>
        <CardDescription className="text-orange-100">Racha Actual</CardDescription>
        <CardTitle className="text-4xl font-bold flex items-center gap-2">
          <span>{currentStreak}</span>
          <span className="text-2xl">dias</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-orange-100">Racha mas larga</span>
          <span className="text-xl font-semibold">{longestStreak} dias</span>
        </div>

        {currentStreak > 0 && (
          <div className="mt-4 flex gap-1">
            {Array.from({ length: Math.min(7, currentStreak) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-white rounded-full animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            {currentStreak > 7 && (
              <span className="text-white/80 text-sm ml-1">+{currentStreak - 7}</span>
            )}
          </div>
        )}

        {currentStreak === 0 && (
          <p className="mt-4 text-sm text-orange-200">
            Completa actividades hoy para iniciar una nueva racha
          </p>
        )}
      </CardContent>
    </Card>
  );
}
