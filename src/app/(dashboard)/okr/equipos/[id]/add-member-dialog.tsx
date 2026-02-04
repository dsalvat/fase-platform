"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Search } from "lucide-react";
import { addTeamMember } from "@/app/actions/okr";
import { TeamMemberRole } from "@prisma/client";

interface AvailableUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AddMemberDialogProps {
  teamId: string;
  availableUsers: AvailableUser[];
}

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  RESPONSABLE: "Responsable",
  EDITOR: "Editor",
  VISUALIZADOR: "Visualizador",
  DIRECTOR: "Director",
};

const ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  RESPONSABLE: "Crea, edita y elimina objetivos",
  EDITOR: "Puede editar objetivos existentes",
  VISUALIZADOR: "Solo puede ver objetivos",
  DIRECTOR: "Supervisor, solo visualiza",
};

export function AddMemberDialog({ teamId, availableUsers }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [role, setRole] = useState<TeamMemberRole>(TeamMemberRole.VISUALIZADOR);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedUser) return;

    setError(null);
    startTransition(async () => {
      const result = await addTeamMember(teamId, selectedUser.id, role);
      if (result.success) {
        setOpen(false);
        setSelectedUser(null);
        setRole(TeamMemberRole.VISUALIZADOR);
        setSearch("");
      } else {
        setError(result.error || "Error al añadir miembro");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Añadir Miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Miembro al Equipo</DialogTitle>
          <DialogDescription>
            Busca y selecciona un usuario para añadir al equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto border rounded-lg">
            {filteredUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No hay usuarios disponibles
              </p>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      selectedUser?.id === user.id ? "bg-blue-50 dark:bg-blue-950/50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name || "Sin nombre"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium">Seleccionado: {selectedUser.name}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol en el equipo</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as TeamMemberRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TeamMemberRole).map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    <div className="flex flex-col">
                      <span className="font-medium">{ROLE_LABELS[roleOption]}</span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[roleOption]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUser || isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Añadiendo...
              </>
            ) : (
              "Añadir Miembro"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
