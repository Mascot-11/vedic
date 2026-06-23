"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  action: (
    formData: FormData
  ) => Promise<{ error: string } | { success: true }>;
}

export default function LoginForm({ action }: Props) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error: string } | { success: true } | null,
      formData: FormData
    ) => {
      return await action(formData);
    },
    null
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
