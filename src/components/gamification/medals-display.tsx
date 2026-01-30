import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MEDAL_CONFIG, MEDAL_LEVEL_CONFIG } from "@/types/gamification";
import { MedalType, MedalLevel } from "@prisma/client";

interface Medal {
  type: MedalType;
  level: MedalLevel;
  earnedAt: Date;
  config: {
    label: string;
    description: string;
    levelConfig: {
      label: string;
      color: string;
      bgColor: string;
    };
  };
}

interface MedalsDisplayProps {
  medals: Medal[];
}

export function MedalsDisplay({ medals }: MedalsDisplayProps) {
  if (medals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medallas Obtenidas</CardTitle>
          <CardDescription>
            Aun no has obtenido ninguna medalla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Completa objetivos y mantén tu racha para ganar medallas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Medallas Obtenidas ({medals.length})</CardTitle>
        <CardDescription>Tus logros en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {medals.map((medal, index) => (
            <MedalBadge key={index} medal={medal} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MedalBadge({ medal }: { medal: Medal }) {
  const levelConfig = medal.config.levelConfig || MEDAL_LEVEL_CONFIG[medal.level];
  const medalConfig = MEDAL_CONFIG[medal.type];

  return (
    <div
      className={`p-4 rounded-lg ${levelConfig.bgColor} text-center transition-transform hover:scale-105`}
    >
      <div className={`text-3xl mb-2 ${levelConfig.color}`}>
        {getMedalIcon(medalConfig.icon)}
      </div>
      <p className={`font-semibold ${levelConfig.color}`}>
        {medalConfig.label}
      </p>
      <p className="text-xs text-gray-600">{levelConfig.label}</p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(medal.earnedAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        })}
      </p>
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
