"use client";

import { useState, useTransition } from "react";
import { OKRKeyResultStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Circle,
  Trash2,
} from "lucide-react";
import { updateKeyResult, deleteKeyResult, toggleKeyActivityComplete } from "@/app/actions/okr";

interface KeyActivity {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  assignee: { id: string; name: string | null } | null;
}

interface KeyResult {
  id: string;
  title: string;
  description: string | null;
  indicator: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  unit: string;
  status: OKRKeyResultStatus;
  responsible: { id: string; name: string | null; image: string | null };
  activities: KeyActivity[];
}

interface TeamMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface KeyResultsListProps {
  keyResults: KeyResult[];
  canEdit: boolean;
  teamMembers: TeamMember[];
}

const STATUS_CONFIG: Record<
  OKRKeyResultStatus,
  { label: string; color: string }
> = {
  NOT_STARTED: { label: "No iniciado", color: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "En progreso", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  AT_RISK: { label: "En riesgo", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  COMPLETED: { label: "Completado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export function KeyResultsList({
  keyResults,
  canEdit,
}: KeyResultsListProps) {
  return (
    <div className="space-y-4">
      {keyResults.map((kr) => (
        <KeyResultItem key={kr.id} keyResult={kr} canEdit={canEdit} />
      ))}
    </div>
  );
}

function KeyResultItem({
  keyResult,
  canEdit,
}: {
  keyResult: KeyResult;
  canEdit: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentValue, setCurrentValue] = useState(keyResult.currentValue.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Calculate progress
  const range = keyResult.targetValue - keyResult.startValue;
  const progress =
    range === 0
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((keyResult.currentValue - keyResult.startValue) / range) * 100
          )
        );

  const statusConfig = STATUS_CONFIG[keyResult.status];

  const handleUpdateValue = () => {
    const newValue = parseFloat(currentValue);
    if (isNaN(newValue)) return;

    startTransition(async () => {
      await updateKeyResult(keyResult.id, { currentValue: newValue });
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Estás seguro de eliminar este Key Result?")) return;

    startTransition(async () => {
      await deleteKeyResult(keyResult.id);
    });
  };

  const handleToggleActivity = (activityId: string) => {
    startTransition(async () => {
      await toggleKeyActivityComplete(activityId);
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{keyResult.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{keyResult.indicator}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>
                      {keyResult.currentValue} / {keyResult.targetValue} {keyResult.unit}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 70
                          ? "bg-green-500"
                          : progress >= 30
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden"
                  title={keyResult.responsible.name || ""}
                >
                  {keyResult.responsible.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={keyResult.responsible.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">
                      {keyResult.responsible.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t bg-muted/50 space-y-4">
            {/* Description */}
            {keyResult.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Descripción
                </p>
                <p className="text-sm">{keyResult.description}</p>
              </div>
            )}

            {/* Update Value */}
            {canEdit && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Valor actual:</span>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      className="w-24 h-8"
                      step="any"
                    />
                    <span className="text-sm text-muted-foreground">
                      {keyResult.unit}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleUpdateValue}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setCurrentValue(keyResult.currentValue.toString());
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    {keyResult.currentValue} {keyResult.unit} - Actualizar
                  </Button>
                )}
              </div>
            )}

            {/* Activities */}
            {keyResult.activities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Actividades ({keyResult.activities.filter((a) => a.completed).length}/
                  {keyResult.activities.length})
                </p>
                <div className="space-y-2">
                  {keyResult.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <button
                        onClick={() => handleToggleActivity(activity.id)}
                        disabled={isPending || !canEdit}
                        className="flex-shrink-0"
                      >
                        {activity.completed ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={activity.completed ? "line-through text-muted-foreground" : ""}
                      >
                        {activity.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canEdit && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
