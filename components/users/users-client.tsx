"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  users: User[];
  currentUser: User;
}

function roleBadgeVariant(role: string) {
  if (role === "superadmin") return "default";
  if (role === "owner") return "secondary";
  return "outline" as any;
}

export default function UsersClient({ users, currentUser }: Props) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const canManageOwner = currentUser.role === "superadmin";

  function handleInvite() {
    startTransition(async () => {
      const supabase = createClient();
      // Create auth user then insert into users table
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { toast.error(error.message); return; }
      if (!data.user) { toast.error("User creation failed"); return; }
      const { error: dbError } = await supabase.from("users").insert({
        name,
        role,
        auth_id: data.user.id,
        active: true,
      });
      if (dbError) { toast.error(dbError.message); return; }
      toast.success(`${name} added as ${role}`);
      setShowInvite(false);
      setEmail(""); setName(""); setPassword("");
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Role</th>
              <th className="text-center px-4 py-2.5 font-medium text-stone-600">Status</th>
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
                <td className="px-4 py-3">
                  <Badge variant={roleBadgeVariant(u.role)} className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={u.active ? "default" : "secondary"}>
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <Dialog open onOpenChange={(open) => !open && setShowInvite(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  {canManageOwner && <option value="owner">Owner</option>}
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setShowInvite(false)} disabled={pending}>Cancel</Button>
                <Button onClick={handleInvite} disabled={pending || !email || !name || !password}>
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
