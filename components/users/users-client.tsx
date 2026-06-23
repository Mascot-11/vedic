"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, toggleUserActive } from "@/app/actions/users";

interface Props {
  users: User[];
  currentUser: User;
}

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
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
  const [pending, startTransition] = useTransition();

  const isSuperadmin = currentUser.role === "superadmin";
  const isOwner = currentUser.role === "owner";

  function handleCreate() {
    startTransition(async () => {
      try {
        await createUser({ name, email, password, role });
        toast.success(`${name} added as ${role}`);
        setShowAdd(false);
        setName(""); setEmail(""); setPassword(""); setRole("staff");
        // Optimistic: reload handled by revalidatePath on server
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function handleToggleActive(u: User) {
    startTransition(async () => {
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

  // Determine if current user can toggle a given user's active state
  function canToggle(u: User) {
    if (u.id === currentUser.id) return false; // can't deactivate yourself
    if (isSuperadmin) return u.role !== "superadmin";
    if (isOwner) return u.role === "staff";
    return false;
  }

  const roleOptions =
    isSuperadmin
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
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Email placeholder</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Role</th>
              <th className="text-center px-4 py-2.5 font-medium text-stone-600">Status</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {u.name}
                  {u.id === currentUser.id && (
                    <span className="ml-2 text-xs text-stone-400">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">—</td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadgeVariant(u.role)} className="capitalize text-xs">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={u.active ? "default" : "secondary"} className="text-xs">
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  {canToggle(u) && (
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={pending}
                      title={u.active ? "Deactivate" : "Activate"}
                      className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {u.active
                        ? <PowerOff className="h-4 w-4" />
                        : <Power className="h-4 w-4 text-green-600" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Dialog open onOpenChange={(open) => !open && setShowAdd(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                The account will be active immediately — no email verification required.
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
                  placeholder="They can change it after first login"
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
                    <option key={r.value} value={r.value}>{r.label}</option>
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
