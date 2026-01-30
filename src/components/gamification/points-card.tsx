import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PointsCardProps {
  points: number;
  level: number;
  levelProgress: number;
  pointsToNextLevel: number | null;
}

export function PointsCard({
  points,
  level,
  levelProgress,
  pointsToNextLevel,
}: PointsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
      <CardHeader>
        <CardDescription className="text-blue-100">Tus Puntos</CardDescription>
        <CardTitle className="text-4xl font-bold">{points.toLocaleString()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-100">Nivel</span>
            <span className="text-2xl font-bold">{level}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-100">Progreso al siguiente nivel</span>
              <span className="text-blue-100">{levelProgress}%</span>
            </div>
            <div className="h-2 bg-blue-400/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            {pointsToNextLevel !== null && (
              <p className="text-xs text-blue-200 text-right">
                {pointsToNextLevel.toLocaleString()} puntos para nivel {level + 1}
              </p>
            )}
            {pointsToNextLevel === null && (
              <p className="text-xs text-blue-200 text-right">
                Nivel maximo alcanzado
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
