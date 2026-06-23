"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, toggleUserActive } from "@/app/actions/users";

type UserWithEmail = User & { email: string };

interface Props {
  users: UserWithEmail[];
  currentUser: User;
}

function roleBadge(role: string): "default" | "secondary" | "outline" {
  if (role === "superadmin") return "default";
  if (role === "owner") return "secondary";
  return "outline";
}

export default function UsersClient({ users: initial, currentUser }: Props) {
  const [users, setUsers] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [pending, start] = useTransition();

  const isSuperadmin = currentUser.role === "superadmin";
  const isOwner = currentUser.role === "owner";

  function handleCreate() {
    start(async () => {
      try {
        await createUser({ name, email, password, role });
        toast.success(`${name} added as ${role}`);
        setUsers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name,
            email,
            role,
            auth_id: "",
            active: true,
            created_at: new Date().toISOString(),
          },
        ]);
        setShowAdd(false);
        setName(""); setEmail(""); setPassword(""); setRole("staff");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function handleToggle(u: UserWithEmail) {
    start(async () => {
      try {
        await toggleUserActive(u.id, !u.active);
        setUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, active: !u.active } : x))
        );
        toast.success(`${u.name} ${!u.active ? "activated" : "deactivated"}`);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function canToggle(u: UserWithEmail) {
    if (u.id === currentUser.id) return false;
    if (isSuperadmin) return u.role !== "superadmin";
    if (isOwner) return u.role === "staff";
    return false;
  }

  const roleOptions = isSuperadmin
    ? [{ value: "owner", label: "Owner" }, { value: "staff", label: "Staff" }]
    : [{ value: "staff", label: "Staff" }];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Email</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Role</th>
              <th className="text-center px-4 py-2.5 font-medium text-stone-600">Status</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className={!u.active ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {u.name}
                  {u.id === currentUser.id && (
                    <span className="ml-2 text-xs text-stone-400">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-500">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadge(u.role)} className="capitalize text-xs">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={u.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  {canToggle(u) && (
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={pending}
                      title={u.active ? "Deactivate" : "Activate"}
                      className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {u.active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Dialog open onOpenChange={(open) => !open && setShowAdd(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Account is active immediately — no email verification required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-1">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rina Shrestha"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rina@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "owner" | "staff")}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setShowAdd(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={pending || !email || !name || !password}
                >
                  {pending ? "Creating…" : "Create User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
