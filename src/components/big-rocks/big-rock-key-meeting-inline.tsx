"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Calendar, ChevronDown, ChevronUp, Target, MessageSquare } from "lucide-react";
import { InlineKeyMeeting } from "@/types/inline-forms";

interface BigRockKeyMeetingInlineProps {
  meetings: InlineKeyMeeting[];
  onAdd: (meeting: InlineKeyMeeting) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, meeting: InlineKeyMeeting) => void;
  disabled?: boolean;
}

export function BigRockKeyMeetingInline({
  meetings,
  onAdd,
  onRemove,
  onUpdate,
  disabled = false,
}: BigRockKeyMeetingInlineProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newExpectedDecision, setNewExpectedDecision] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleAddNew = () => {
    if (newTitle.trim().length >= 3 && newDate) {
      onAdd({
        title: newTitle.trim(),
        objective: newObjective.trim(),
        expectedDecision: newExpectedDecision.trim() || null,
        date: newDate,
        description: newDescription.trim() || null,
      });
      // Reset form
      setNewTitle("");
      setNewObjective("");
      setNewExpectedDecision("");
      setNewDate("");
      setNewDescription("");
      setShowNewForm(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Meetings List */}
      {meetings.length > 0 && (
        <div className="space-y-2">
          {meetings.map((meeting, index) => (
            <Card key={index} className="border-muted">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {meeting.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(meeting.date)}
                    </span>
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    )}
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              {expandedIndex === index && (
                <CardContent className="pt-0 pb-3 px-4 space-y-3">
                  {disabled ? (
                    // Read-only view
                    <div className="space-y-2">
                      {meeting.objective && (
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Objetivo</p>
                            <p className="text-sm">{meeting.objective}</p>
                          </div>
                        </div>
                      )}
                      {meeting.expectedDecision && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Decision esperada</p>
                            <p className="text-sm">{meeting.expectedDecision}</p>
                          </div>
                        </div>
                      )}
                      {meeting.description && (
                        <div>
                          <p className="text-xs text-muted-foreground">Descripcion</p>
                          <p className="text-sm">{meeting.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Editable view
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Titulo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={meeting.title}
                          onChange={(e) =>
                            onUpdate(index, { ...meeting, title: e.target.value })
                          }
                          placeholder="Titulo de la reunion"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Objetivo</Label>
                        <textarea
                          value={meeting.objective || ""}
                          onChange={(e) =>
                            onUpdate(index, {
                              ...meeting,
                              objective: e.target.value,
                            })
                          }
                          placeholder="Cual es el proposito de esta reunion?"
                          rows={2}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Decision esperada</Label>
                        <textarea
                          value={meeting.expectedDecision || ""}
                          onChange={(e) =>
                            onUpdate(index, {
                              ...meeting,
                              expectedDecision: e.target.value,
                            })
                          }
                          placeholder="Que decision debe salir de esta reunion?"
                          rows={2}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Fecha <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="datetime-local"
                          value={meeting.date.slice(0, 16)}
                          onChange={(e) =>
                            onUpdate(index, {
                              ...meeting,
                              date: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Meeting Form */}
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
              <Plus className="h-4 w-4 mr-2" />
              Agregar reunion clave
            </Button>
          ) : (
            <Card className="border-dashed border-blue-500">
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Nueva reunion clave</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meetingTitle" className="text-xs">
                    Titulo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="meetingTitle"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Titulo de la reunion"
                    minLength={3}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meetingObjective" className="text-xs">
                    Objetivo
                  </Label>
                  <textarea
                    id="meetingObjective"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Cual es el proposito de esta reunion?"
                    rows={2}
                    maxLength={500}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meetingExpectedDecision" className="text-xs">
                    Decision esperada
                  </Label>
                  <textarea
                    id="meetingExpectedDecision"
                    value={newExpectedDecision}
                    onChange={(e) => setNewExpectedDecision(e.target.value)}
                    placeholder="Que decision debe salir de esta reunion?"
                    rows={2}
                    maxLength={500}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meetingDate" className="text-xs">
                    Fecha y hora <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="meetingDate"
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meetingDescription" className="text-xs">
                    Descripcion adicional
                  </Label>
                  <textarea
                    id="meetingDescription"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Notas o detalles adicionales"
                    rows={2}
                    maxLength={2000}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNew}
                  disabled={newTitle.trim().length < 3 || !newDate}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar reunion
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {meetings.length === 0 && !showNewForm && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No hay reuniones clave agregadas.
        </p>
      )}
    </div>
  );
}
