"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BigRockWithCounts } from "@/types/big-rock";
import { generateMonthOptions, getCurrentMonth, getNextMonth } from "@/lib/month-helpers";
import { BigRockKeyPersonSelector } from "./big-rock-key-person-selector";
import { BigRockKeyMeetingInline } from "./big-rock-key-meeting-inline";
import { KeyPerson } from "@prisma/client";
import { InlineKeyPerson, InlineKeyMeeting } from "@/types/inline-forms";
import { Users, Calendar } from "lucide-react";

interface BigRockFormFieldsProps {
  defaultValues?: Partial<BigRockWithCounts>;
  defaultMonth?: string;
  isPending?: boolean;
  mode?: "create" | "edit";
  isConfirmed?: boolean;
  canResetStatus?: boolean;
  // Key People props
  availableKeyPeople?: KeyPerson[];
  selectedKeyPeopleIds?: string[];
  newKeyPeople?: InlineKeyPerson[];
  onSelectKeyPerson?: (id: string) => void;
  onDeselectKeyPerson?: (id: string) => void;
  onAddNewKeyPerson?: (person: InlineKeyPerson) => void;
  onRemoveNewKeyPerson?: (index: number) => void;
  // Key Meetings props
  keyMeetings?: InlineKeyMeeting[];
  onAddKeyMeeting?: (meeting: InlineKeyMeeting) => void;
  onRemoveKeyMeeting?: (index: number) => void;
  onUpdateKeyMeeting?: (index: number, meeting: InlineKeyMeeting) => void;
}

// Status options for confirmed Big Rocks (users can progress to EN_PROGRESO or FINALIZADO)
const statusOptionsForConfirmed = [
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "FEEDBACK_RECIBIDO", label: "Feedback Recibido" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

// Status options for admin/superadmin (includes CREADO to allow resetting)
const statusOptionsForAdmin = [
  { value: "CREADO", label: "Creado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "FEEDBACK_RECIBIDO", label: "Feedback Recibido" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

/**
 * Reusable form fields for Big Rock create/edit forms
 * Client Component - needs state and interactivity
 */
export function BigRockFormFields({
  defaultValues,
  defaultMonth,
  isPending = false,
  mode = "create",
  isConfirmed = false,
  canResetStatus = false,
  // Key People props
  availableKeyPeople = [],
  selectedKeyPeopleIds = [],
  newKeyPeople = [],
  onSelectKeyPerson,
  onDeselectKeyPerson,
  onAddNewKeyPerson,
  onRemoveNewKeyPerson,
  // Key Meetings props
  keyMeetings = [],
  onAddKeyMeeting,
  onRemoveKeyMeeting,
  onUpdateKeyMeeting,
}: BigRockFormFieldsProps) {
  const monthOptions = generateMonthOptions(12, getCurrentMonth());
  const defaultMonthValue = defaultMonth || getNextMonth(getCurrentMonth());

  // When confirmed, core fields are read-only (unless admin can reset status)
  const coreFieldsDisabled = isPending || (isConfirmed && !canResetStatus);

  return (
    <div className="space-y-4">
      {/* Confirmed banner */}
      {isConfirmed && !canResetStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
          <p className="font-medium">Big Rock confirmado</p>
          <p>Solo puedes editar el numero de TARs, Personas Clave y Reuniones Clave.</p>
        </div>
      )}
      {/* Admin reset banner */}
      {isConfirmed && canResetStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-800 text-sm">
          <p className="font-medium">Modo administrador</p>
          <p>Puedes editar todos los campos y cambiar el estado a CREADO si es necesario.</p>
        </div>
      )}
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Nombre del objetivo mensual"
          defaultValue={defaultValues?.title}
          required
          minLength={3}
          maxLength={100}
          disabled={coreFieldsDisabled}
        />
        <p className="text-xs text-muted-foreground">
          Entre 3 y 100 caracteres
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="description"
          name="description"
          placeholder="Describe detalladamente tu objetivo..."
          defaultValue={defaultValues?.description}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          disabled={coreFieldsDisabled}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Entre 10 y 2000 caracteres
        </p>
      </div>

      {/* Indicator */}
      <div className="space-y-2">
        <Label htmlFor="indicator">
          Indicador de Éxito <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="indicator"
          name="indicator"
          placeholder="¿Cómo medirás el éxito de este objetivo?"
          defaultValue={defaultValues?.indicator}
          required
          minLength={5}
          maxLength={500}
          rows={2}
          disabled={coreFieldsDisabled}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Entre 5 y 500 caracteres
        </p>
      </div>

      {/* Number of TARs */}
      <div className="space-y-2">
        <Label htmlFor="numTars">
          Número de TARs <span className="text-red-500">*</span>
        </Label>
        <Input
          id="numTars"
          name="numTars"
          type="number"
          placeholder="5"
          defaultValue={defaultValues?.numTars}
          required
          min={1}
          max={20}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Entre 1 y 20 tareas de alto rendimiento
        </p>
      </div>

      {/* Month (only in create mode or shown as read-only in edit) */}
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="month">
            Mes <span className="text-red-500">*</span>
          </Label>
          <Select
            name="month"
            defaultValue={defaultValues?.month || defaultMonthValue}
            required
            disabled={isPending}
          >
            <SelectTrigger id="month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecciona el mes para este Big Rock
          </p>
        </div>
      )}

      {/* Status (only in edit mode when confirmed or admin can reset) */}
      {mode === "edit" && (isConfirmed || canResetStatus) && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            name="status"
            defaultValue={defaultValues?.status || "CREADO"}
            disabled={isPending}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(canResetStatus ? statusOptionsForAdmin : statusOptionsForConfirmed).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {canResetStatus
              ? "Como administrador, puedes cambiar el estado a CREADO para permitir ediciones"
              : "Cambia el estado a medida que avanzas en el objetivo"}
          </p>
        </div>
      )}

      {/* Key People Section */}
      {onSelectKeyPerson && onDeselectKeyPerson && onAddNewKeyPerson && onRemoveNewKeyPerson && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <Label className="text-base font-semibold">Personas Clave</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona personas existentes o crea nuevas que te ayudaran a lograr este objetivo.
          </p>
          <BigRockKeyPersonSelector
            availableKeyPeople={availableKeyPeople}
            selectedIds={selectedKeyPeopleIds}
            newPeople={newKeyPeople}
            onSelect={onSelectKeyPerson}
            onDeselect={onDeselectKeyPerson}
            onAddNew={onAddNewKeyPerson}
            onRemoveNew={onRemoveNewKeyPerson}
            disabled={isPending}
          />
        </div>
      )}

      {/* Key Meetings Section */}
      {onAddKeyMeeting && onRemoveKeyMeeting && onUpdateKeyMeeting && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Label className="text-base font-semibold">Reuniones Clave</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Agrega las reuniones necesarias para validar, refinar y tomar decisiones sobre este objetivo.
          </p>
          <BigRockKeyMeetingInline
            meetings={keyMeetings}
            onAdd={onAddKeyMeeting}
            onRemove={onRemoveKeyMeeting}
            onUpdate={onUpdateKeyMeeting}
            disabled={isPending}
          />
        </div>
      )}
    </div>
  );
}
