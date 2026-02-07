import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatsCardProps {
  stats: {
    bigRocksCreated: number;
    tarsCompleted: number;
    weeklyReviews: number;
    dailyLogs: number;
  };
}

export function StatsCard({ stats }: StatsCardProps) {
  const statItems = [
    {
      label: "Big Rocks Creados",
      value: stats.bigRocksCreated,
      icon: "target",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      label: "TARs Completadas",
      value: stats.tarsCompleted,
      icon: "check",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950/30",
    },
    {
      label: "Revisiones Semanales",
      value: stats.weeklyReviews,
      icon: "calendar",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950/30",
    },
    {
      label: "Registros Diarios",
      value: stats.dailyLogs,
      icon: "edit",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-950/30",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estadisticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`p-4 rounded-lg ${item.bgColor}`}
            >
              <p className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
