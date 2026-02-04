"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Circle,
  Trash2,
  Plus,
  History,
  CalendarClock,
} from "lucide-react";
import { deleteKeyResult, toggleKeyActivityComplete, createKeyResultUpdate, getKeyResultUpdates } from "@/app/actions/okr";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface KeyActivity {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  assignee: { id: string; name: string | null } | null;
}

interface KeyResultUpdate {
  id: string;
  weekNumber: number;
  previousValue: number;
  newValue: number;
  comment: string;
  createdAt: Date;
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
  responsible: { id: string; name: string | null; image: string | null };
  activities: KeyActivity[];
  updates?: KeyResultUpdate[];
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
  currentWeekNumber: number;
}

export function KeyResultsList({
  keyResults,
  canEdit,
  currentWeekNumber,
}: KeyResultsListProps) {
  return (
    <div className="space-y-4">
      {keyResults.map((kr) => (
        <KeyResultItem
          key={kr.id}
          keyResult={kr}
          canEdit={canEdit}
          currentWeekNumber={currentWeekNumber}
        />
      ))}
    </div>
  );
}

function KeyResultItem({
  keyResult,
  canEdit,
  currentWeekNumber,
}: {
  keyResult: KeyResult;
  canEdit: boolean;
  currentWeekNumber: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [updates, setUpdates] = useState<KeyResultUpdate[]>(keyResult.updates || []);
  const [newValue, setNewValue] = useState(keyResult.currentValue.toString());
  const [comment, setComment] = useState("");

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

  // Check if current week has an update
  const currentWeekUpdate = updates.find(u => u.weekNumber === currentWeekNumber);
  const lastUpdate = updates.length > 0
    ? updates.reduce((latest, u) => u.weekNumber > latest.weekNumber ? u : latest, updates[0])
    : null;

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

  const handleSubmitUpdate = () => {
    const value = parseFloat(newValue);
    if (isNaN(value) || !comment.trim()) return;

    startTransition(async () => {
      const result = await createKeyResultUpdate({
        keyResultId: keyResult.id,
        weekNumber: currentWeekNumber,
        newValue: value,
        comment: comment.trim(),
      });

      if (result.success) {
        setShowUpdateDialog(false);
        setComment("");
        // Refresh updates
        const updatesResult = await getKeyResultUpdates(keyResult.id);
        if (updatesResult.success) {
          setUpdates(updatesResult.data as KeyResultUpdate[]);
        }
      }
    });
  };

  // Load updates when expanding
  useEffect(() => {
    if (isOpen && updates.length === 0) {
      getKeyResultUpdates(keyResult.id).then((result) => {
        if (result.success) {
          setUpdates(result.data as KeyResultUpdate[]);
        }
      });
    }
  }, [isOpen, keyResult.id, updates.length]);

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
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Semana {currentWeekNumber}/12
                  </span>
                  {currentWeekUpdate ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      ✓ Actualizado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Pendiente actualización
                    </span>
                  )}
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

            {/* Weekly Update Actions */}
            {canEdit && (
              <div className="flex items-center gap-3">
                <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant={currentWeekUpdate ? "outline" : "default"}>
                      <Plus className="h-4 w-4 mr-1" />
                      {currentWeekUpdate ? "Editar actualización semanal" : "Añadir actualización semanal"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Actualización Semana {currentWeekNumber}
                      </DialogTitle>
                      <DialogDescription>
                        Registra el progreso de este resultado clave para la semana actual.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newValue">Nuevo valor del indicador</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="newValue"
                            type="number"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            step="any"
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            {keyResult.unit} (Objetivo: {keyResult.targetValue})
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment">Comentario sobre el progreso</Label>
                        <Textarea
                          id="comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Describe el progreso, obstáculos o logros de esta semana..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmitUpdate}
                        disabled={isPending || !comment.trim()}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Guardar actualización
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <History className="h-4 w-4 mr-1" />
                      Ver historial ({updates.length}/12)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Historial de Actualizaciones</DialogTitle>
                      <DialogDescription>
                        Todas las actualizaciones semanales de este resultado clave.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      {updates.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No hay actualizaciones registradas todavía.
                        </p>
                      ) : (
                        updates
                          .sort((a, b) => b.weekNumber - a.weekNumber)
                          .map((update) => (
                            <div
                              key={update.id}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    Semana {update.weekNumber}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(update.createdAt), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {update.previousValue} → {update.newValue} {keyResult.unit}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    update.newValue > update.previousValue
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : update.newValue < update.previousValue
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {update.newValue > update.previousValue
                                    ? `+${(update.newValue - update.previousValue).toFixed(1)}`
                                    : update.newValue < update.previousValue
                                    ? `${(update.newValue - update.previousValue).toFixed(1)}`
                                    : "Sin cambio"}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80">
                                {update.comment}
                              </p>
                            </div>
                          ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Last Update Summary */}
            {lastUpdate && (
              <div className="p-3 bg-card border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Última actualización (Semana {lastUpdate.weekNumber})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {lastUpdate.comment}
                </p>
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
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
