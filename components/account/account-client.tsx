"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/users";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  user: User;
}

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "superadmin") return "default";
  if (role === "owner") return "secondary";
  return "outline";
}

export default function AccountClient({ user }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (next !== confirm) {
      toast.error("The two passwords don't match — please check");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword(next);
        toast.success("Password changed — you're all set");
        setCurrent(""); setNext(""); setConfirm("");
      } catch (e: any) {
        toast.error('Something went wrong. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Profile info card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-stone-700">Profile</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-stone-900">{user.name}</p>
            <p className="text-sm text-stone-500 mt-0.5 capitalize">{user.role}</p>
          </div>
          <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>
          {next && confirm && next !== confirm && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
          <div className="pt-1">
            <Button
              type="submit"
              disabled={pending || !next || !confirm || next !== confirm}
            >
              {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {pending ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
