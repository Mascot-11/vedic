"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, PowerOff, Power, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, toggleUserActive, deleteUser } from "@/app/actions/users";

type UserWithEmail = User & { email: string };
interface Props { users: UserWithEmail[]; currentUser: User; }

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperadmin = currentUser.role === "superadmin";
  const isOwner = currentUser.role === "owner";

  function handleCreate() {
    start(async () => {
      try {
        await createUser({ name, email, password, role });
        toast.success(`${name} added as ${role}`);
        setUsers((prev) => [...prev, { id: crypto.randomUUID(), name, email, role, auth_id: "", active: true, created_at: new Date().toISOString() }]);
        setShowAdd(false);
        setName(""); setEmail(""); setPassword(""); setRole("staff");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function handleToggle(u: UserWithEmail) {
    start(async () => {
      try {
        await toggleUserActive(u.id, !u.active);
        setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, active: !u.active } : x));
        toast.success(`${u.name} ${!u.active ? "activated" : "deactivated"}`);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function handleDelete(u: UserWithEmail) {
    if (!confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    setDeletingId(u.id);
    start(async () => {
      try {
        await deleteUser(u.id);
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        toast.success(`${u.name} deleted`);
      } catch (e: any) { toast.error(e.message); }
      finally { setDeletingId(null); }
    });
  }

  function canDelete(u: UserWithEmail) {
    return isSuperadmin && u.id !== currentUser.id && u.role !== "superadmin";
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

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className={`bg-white rounded-2xl border border-stone-200 px-4 py-3 flex items-center gap-3 ${!u.active ? "opacity-50" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-sm shrink-0">
              {u.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-stone-900 text-sm">{u.name}</p>
                {u.id === currentUser.id && <span className="text-xs text-stone-400">(you)</span>}
                <Badge variant={roleBadge(u.role)} className="text-[10px] capitalize px-1.5 py-0">{u.role}</Badge>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 truncate">{u.email || "—"}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canToggle(u) && (
                <button
                  onClick={() => handleToggle(u)}
                  disabled={pending}
                  className="h-11 w-11 flex items-center justify-center text-stone-300 hover:text-stone-600 transition-colors rounded-xl hover:bg-stone-100"
                  title={u.active ? "Deactivate" : "Activate"}
                >
                  {u.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-green-500" />}
                </button>
              )}
              {canDelete(u) && (
                <button
                  onClick={() => handleDelete(u)}
                  disabled={pending}
                  className="h-11 w-11 flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                  title="Delete user"
                >
                  {deletingId === u.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-stone-400 py-10 text-sm">No users yet.</p>
        )}
      </div>

      {showAdd && (
        <Dialog open onOpenChange={(open) => !open && setShowAdd(false)}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>Account is active immediately — no email verification.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-1">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rina Shrestha" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rina@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white" value={role} onChange={(e) => setRole(e.target.value as any)}>
                  {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setShowAdd(false)} disabled={pending}>Cancel</Button>
                <Button onClick={handleCreate} disabled={pending || !email || !name || !password}>
                  {pending ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
