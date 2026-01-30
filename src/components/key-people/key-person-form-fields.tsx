"use client";

import { KeyPerson } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface KeyPersonFormFieldsProps {
  defaultValues?: Partial<KeyPerson>;
  isPending?: boolean;
}

/**
 * Reusable form fields for KeyPerson create/edit forms
 * Client Component - needs state and interactivity
 */
export function KeyPersonFormFields({
  defaultValues,
  isPending = false,
}: KeyPersonFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          placeholder="Ej: Juan"
          defaultValue={defaultValues?.firstName}
          required
          minLength={2}
          maxLength={50}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Entre 2 y 50 caracteres.
        </p>
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">
          Apellido <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          placeholder="Ej: Garcia"
          defaultValue={defaultValues?.lastName}
          required
          minLength={2}
          maxLength={50}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Entre 2 y 50 caracteres.
        </p>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Input
          id="role"
          name="role"
          type="text"
          placeholder="Ej: Director de Proyecto, Mentor, Cliente"
          defaultValue={defaultValues?.role || ""}
          maxLength={100}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Describe el rol de esta persona en relacion con tus
          objetivos.
        </p>
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="contact">Contacto</Label>
        <Input
          id="contact"
          name="contact"
          type="text"
          placeholder="Ej: email@ejemplo.com o +34 600 000 000"
          defaultValue={defaultValues?.contact || ""}
          maxLength={200}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Email o telefono de contacto.
        </p>
      </div>
    </div>
  );
}
