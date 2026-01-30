import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MEDAL_CONFIG, MEDAL_LEVEL_CONFIG } from "@/types/gamification";
import { MedalType, MedalLevel } from "@prisma/client";

interface MedalProgress {
  current: number;
  nextLevel: MedalLevel | null;
  nextThreshold: number | null;
  percentage: number;
  completed?: boolean;
}

interface MedalsProgressProps {
  progress: Record<MedalType, MedalProgress>;
}

export function MedalsProgress({ progress }: MedalsProgressProps) {
  const medalTypes: MedalType[] = [
    "CONSTANCIA",
    "CLARIDAD",
    "EJECUCION",
    "MEJORA_CONTINUA",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progreso de Medallas</CardTitle>
        <CardDescription>Tu avance hacia las proximas medallas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {medalTypes.map((type) => (
          <MedalProgressItem
            key={type}
            type={type}
            progress={progress[type]}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function MedalProgressItem({
  type,
  progress,
}: {
  type: MedalType;
  progress: MedalProgress;
}) {
  const config = MEDAL_CONFIG[type];
  const levelConfig = progress.nextLevel
    ? MEDAL_LEVEL_CONFIG[progress.nextLevel]
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getMedalIcon(config.icon)}</span>
          <div>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
        {progress.completed ? (
          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
            Completado
          </span>
        ) : levelConfig ? (
          <span
            className={`text-xs px-2 py-1 rounded-full ${levelConfig.bgColor} ${levelConfig.color}`}
          >
            Siguiente: {levelConfig.label}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.completed
                ? "bg-cyan-500"
                : levelConfig
                ? getLevelColor(progress.nextLevel!)
                : "bg-gray-400"
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 min-w-[80px] text-right">
          {progress.current}
          {progress.nextThreshold && ` / ${progress.nextThreshold}`}
        </span>
      </div>
    </div>
  );
}

function getMedalIcon(iconName: string): string {
  const icons: Record<string, string> = {
    flame: "🔥",
    target: "🎯",
    "check-circle": "✅",
    "refresh-cw": "🔄",
  };
  return icons[iconName] || "🏅";
}

function getLevelColor(level: MedalLevel): string {
  const colors: Record<MedalLevel, string> = {
    BRONCE: "bg-amber-500",
    PLATA: "bg-gray-400",
    ORO: "bg-yellow-500",
    DIAMANTE: "bg-cyan-500",
  };
  return colors[level];
}
