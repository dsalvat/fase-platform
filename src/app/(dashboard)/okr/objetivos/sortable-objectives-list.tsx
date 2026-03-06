"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { reorderObjectives } from "@/app/actions/okr";

interface Objective {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  team: { name: string };
  keyResults: { id: string }[];
}

interface SortableObjectivesListProps {
  objectives: Objective[];
  translations: {
    statusDraft: string;
    statusActive: string;
    statusCompleted: string;
    statusCancelled: string;
    keyResults: string;
  };
}

function SortableObjectiveCard({
  objective,
  translations,
}: {
  objective: Objective;
  translations: SortableObjectivesListProps["translations"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objective.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusLabel =
    objective.status === "DRAFT"
      ? translations.statusDraft
      : objective.status === "ACTIVE"
      ? translations.statusActive
      : objective.status === "COMPLETED"
      ? translations.statusCompleted
      : translations.statusCancelled;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch border rounded-lg transition-colors ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary/20" : "hover:bg-muted/50"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center px-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        tabIndex={0}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Objective card content (clickable link) */}
      <Link
        href={`/okr/objetivos/${objective.id}`}
        className="flex-1 p-4 min-w-0"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{objective.team.name}</Badge>
              <Badge
                variant={
                  objective.status === "COMPLETED"
                    ? "default"
                    : objective.status === "ACTIVE"
                    ? "secondary"
                    : "outline"
                }
              >
                {statusLabel}
              </Badge>
            </div>
            <h3 className="font-medium">{objective.title}</h3>
            {objective.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {objective.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {objective.keyResults.length} {translations.keyResults}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-bold ${
                objective.progress >= 70
                  ? "text-green-600"
                  : objective.progress >= 30
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            >
              {Math.round(objective.progress)}%
            </p>
            <div className="w-24 h-2 bg-muted rounded-full mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  objective.progress >= 70
                    ? "bg-green-500"
                    : objective.progress >= 30
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
                }`}
                style={{ width: `${objective.progress}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function SortableObjectivesList({
  objectives: initialObjectives,
  translations,
}: SortableObjectivesListProps) {
  const [objectives, setObjectives] = useState(initialObjectives);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = objectives.findIndex((o) => o.id === active.id);
    const newIndex = objectives.findIndex((o) => o.id === over.id);

    const reordered = arrayMove(objectives, oldIndex, newIndex);
    setObjectives(reordered);

    // Persist to server
    startTransition(async () => {
      await reorderObjectives(reordered.map((o) => o.id));
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={objectives.map((o) => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {objectives.map((objective) => (
            <SortableObjectiveCard
              key={objective.id}
              objective={objective}
              translations={translations}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
