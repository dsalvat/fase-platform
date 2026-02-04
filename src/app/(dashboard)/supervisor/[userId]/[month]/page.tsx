import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { getSuperviseeMonthPlanning } from "@/app/actions/planning";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { formatMonthLabel } from "@/lib/month-helpers";
import { UserRole } from "@prisma/client";
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Calendar,
  Users,
  Star,
  MessageSquare,
  Play,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    userId: string;
    month: string;
  }>;
}

const statusConfig: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  CREADO: {
    label: "Creado",
    icon: Circle,
    color: "text-gray-500",
  },
  CONFIRMADO: {
    label: "Confirmado",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  FEEDBACK_RECIBIDO: {
    label: "Feedback Recibido",
    icon: MessageSquare,
    color: "text-purple-500",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    icon: Play,
    color: "text-orange-500",
  },
  FINALIZADO: {
    label: "Finalizado",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

export default async function SuperviseePlanningPage({ params }: PageProps) {
  const { userId, month } = await params;
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  // Only supervisors and admins can access
  if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    redirect("/big-rocks");
  }

  const tFeedback = await getTranslations("feedback");
  const tBigRocks = await getTranslations("bigRocks");

  // Get the planning data
  const planningData = await getSuperviseeMonthPlanning(userId, month);

  if (!planningData) {
    notFound();
  }

  // Get the OpenMonth ID for month feedback
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId: userId,
      month: month,
    },
    select: { id: true },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/supervisor?month=${month}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tBigRocks("backToList")}
          </Button>
        </Link>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {planningData.user.image ? (
              <img
                src={planningData.user.image}
                alt={planningData.user.name || ""}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">
                {planningData.user.name || planningData.user.email}
              </CardTitle>
              <p className="text-gray-500">{planningData.user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100 text-green-800">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Planificacion Confirmada
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatMonthLabel(month)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Big Rocks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Big Rocks ({planningData.bigRocks.length})
        </h2>

        {planningData.bigRocks.map((bigRock) => {
          const statusInfo = statusConfig[bigRock.status] || statusConfig.CREADO;
          const StatusIcon = statusInfo.icon;
          const completedTars = bigRock.tars.filter(
            (t) => t.status === "COMPLETADA"
          ).length;

          return (
            <Card key={bigRock.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{bigRock.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <StatusIcon className={statusInfo.color} />
                        <span>{statusInfo.label}</span>
                      </div>
                      {bigRock.aiScore !== null && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          IA: {bigRock.aiScore}/100
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {tBigRocks("description")}
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {bigRock.description}
                  </p>
                </div>

                {/* Indicator */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {tBigRocks("indicator")}
                  </h4>
                  <p className="text-sm text-gray-600">{bigRock.indicator}</p>
                </div>

                {/* TARs */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    TARs ({completedTars}/{bigRock.tars.length})
                  </h4>
                  {bigRock.tars.length > 0 ? (
                    <ul className="space-y-1">
                      {bigRock.tars.map((tar) => (
                        <li
                          key={tar.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {tar.status === "COMPLETADA" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : tar.status === "EN_PROGRESO" ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-gray-600">{tar.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Sin TARs creadas</p>
                  )}
                </div>

                {/* Key Meetings */}
                {bigRock.keyMeetings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Reuniones Clave ({bigRock.keyMeetings.length})
                    </h4>
                    <ul className="space-y-1">
                      {bigRock.keyMeetings.map((meeting) => (
                        <li
                          key={meeting.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {meeting.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-gray-600">{meeting.title}</span>
                          <span className="text-xs text-gray-400">
                            ({new Date(meeting.date).toLocaleDateString()})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key People */}
                {bigRock.keyPeople.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personas Clave ({bigRock.keyPeople.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {bigRock.keyPeople.map((person) => (
                        <Badge key={person.id} variant="secondary">
                          {person.user.name || person.user.email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback section */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {tFeedback("bigRockFeedback")}
                  </h4>
                  <FeedbackForm
                    targetType="BIG_ROCK"
                    targetId={bigRock.id}
                    existingFeedback={bigRock.feedback}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Month feedback */}
      {openMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {tFeedback("monthFeedback")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackForm
              targetType="MONTH_PLANNING"
              targetId={openMonth.id}
              existingFeedback={planningData.monthFeedback}
              compact
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
