import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  ListChecks,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

interface TarProgress {
  id: string;
  description: string;
  progress: number;
  bigRockId: string;
  bigRockTitle: string;
}

interface MonthProgressData {
  bigRocksTotal: number;
  bigRocksConfirmed: number;
  tarsTotal: number;
  tarsCompleted: number;
  avgProgress: number;
  meetingsTotal: number;
  meetingsCompleted: number;
  pendingTars: TarProgress[];
}

interface MonthProgressSummaryProps {
  data: MonthProgressData;
  translations: {
    overallProgress: string;
    bigRocks: string;
    tars: string;
    meetings: string;
    confirmed: string;
    completed: string;
    pendingTars: string;
    viewAll: string;
    noPendingTars: string;
  };
}

export function MonthProgressSummary({
  data,
  translations: t,
}: MonthProgressSummaryProps) {
  const progressColor =
    data.avgProgress >= 70
      ? "bg-green-600"
      : data.avgProgress >= 30
        ? "bg-blue-600"
        : "bg-gray-400";

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                {t.overallProgress}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(data.avgProgress)}%
            </div>
            <Progress
              value={data.avgProgress}
              className={`h-2 mt-2 [&>div]:${progressColor}`}
            />
          </CardContent>
        </Card>

        {/* Big Rocks */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">
                {t.bigRocks}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {data.bigRocksConfirmed}
              <span className="text-sm font-normal text-muted-foreground">
                /{data.bigRocksTotal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.confirmed}
            </p>
          </CardContent>
        </Card>

        {/* TARs */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">{t.tars}</span>
            </div>
            <div className="text-2xl font-bold">
              {data.tarsCompleted}
              <span className="text-sm font-normal text-muted-foreground">
                /{data.tarsTotal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.completed}
            </p>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">
                {t.meetings}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {data.meetingsCompleted}
              <span className="text-sm font-normal text-muted-foreground">
                /{data.meetingsTotal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.completed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending TARs */}
      {data.pendingTars.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">{t.pendingTars}</h3>
              <Link
                href="/big-rocks"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                {t.viewAll}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {data.pendingTars.slice(0, 5).map((tar) => (
                <Link
                  key={tar.id}
                  href={`/big-rocks/${tar.bigRockId}`}
                  className="block hover:bg-muted/50 rounded-md -mx-1 px-1 py-1 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] mb-1 font-normal"
                      >
                        {tar.bigRockTitle}
                      </Badge>
                      <p className="text-sm truncate">{tar.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Progress
                        value={tar.progress}
                        className="w-16 h-2"
                      />
                      <span className="text-xs font-medium w-8 text-right">
                        {tar.progress}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
