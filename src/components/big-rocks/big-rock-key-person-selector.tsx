"use client";

import { useState } from "react";
import { KeyPerson } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, User, UserPlus } from "lucide-react";
import { InlineKeyPerson } from "@/types/inline-forms";

interface BigRockKeyPersonSelectorProps {
  availableKeyPeople: KeyPerson[];
  selectedIds: string[];
  newPeople: InlineKeyPerson[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onAddNew: (person: InlineKeyPerson) => void;
  onRemoveNew: (index: number) => void;
  disabled?: boolean;
}

export function BigRockKeyPersonSelector({
  availableKeyPeople,
  selectedIds,
  newPeople,
  onSelect,
  onDeselect,
  onAddNew,
  onRemoveNew,
  disabled = false,
}: BigRockKeyPersonSelectorProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newContact, setNewContact] = useState("");

  const handleAddNew = () => {
    if (newFirstName.trim().length >= 2 && newLastName.trim().length >= 2) {
      onAddNew({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        role: newRole.trim() || null,
        contact: newContact.trim() || null,
      });
      // Reset form
      setNewFirstName("");
      setNewLastName("");
      setNewRole("");
      setNewContact("");
      setShowNewForm(false);
    }
  };

  const selectedPeople = availableKeyPeople.filter((p) =>
    selectedIds.includes(p.id)
  );
  const unselectedPeople = availableKeyPeople.filter(
    (p) => !selectedIds.includes(p.id)
  );

  return (
    <div className="space-y-4">
      {/* Selected People */}
      {(selectedPeople.length > 0 || newPeople.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Personas seleccionadas</Label>
          <div className="flex flex-wrap gap-2">
            {selectedPeople.map((person) => (
              <Badge
                key={person.id}
                variant="secondary"
                className="flex items-center gap-1 py-1 px-2"
              >
                <User className="h-3 w-3" />
                <span>
                  {person.firstName} {person.lastName}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onDeselect(person.id)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {newPeople.map((person, index) => (
              <Badge
                key={`new-${index}`}
                variant="outline"
                className="flex items-center gap-1 py-1 px-2 border-dashed border-green-500 text-green-700"
              >
                <UserPlus className="h-3 w-3" />
                <span>
                  {person.firstName} {person.lastName}
                </span>
                <span className="text-xs text-muted-foreground">(nueva)</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveNew(index)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available People to Select */}
      {unselectedPeople.length > 0 && !disabled && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Personas disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {unselectedPeople.map((person) => (
              <Badge
                key={person.id}
                variant="outline"
                className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onSelect(person.id)}
              >
                <Plus className="h-3 w-3" />
                <span>
                  {person.firstName} {person.lastName}
                </span>
                {person.role && (
                  <span className="text-xs text-muted-foreground">
                    ({person.role})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* New Person Form */}
      {!disabled && (
        <>
          {!showNewForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Crear nueva persona
            </Button>
          ) : (
            <Card className="border-dashed border-green-500">
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Nueva persona clave</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="newFirstName" className="text-xs">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newFirstName"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="Nombre"
                      minLength={2}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newLastName" className="text-xs">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newLastName"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Apellidos"
                      minLength={2}
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="newRole" className="text-xs">
                      Rol
                    </Label>
                    <Input
                      id="newRole"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Ej: Mentor, Cliente"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newContact" className="text-xs">
                      Contacto
                    </Label>
                    <Input
                      id="newContact"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="Email o telefono"
                      maxLength={200}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNew}
                  disabled={
                    newFirstName.trim().length < 2 ||
                    newLastName.trim().length < 2
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar persona
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {selectedPeople.length === 0 &&
        newPeople.length === 0 &&
        unselectedPeople.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No hay personas clave disponibles. Crea una nueva.
          </p>
        )}
    </div>
  );
}
