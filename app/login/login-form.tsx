"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

interface Props {
  action: (formData: FormData) => Promise<{ error: string } | { success: true }>;
}

export default function LoginForm({ action }: Props) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | { success: true } | null, formData: FormData) => {
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
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-stone-700">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11 rounded-xl border-stone-200 bg-white text-base placeholder:text-stone-300 focus:border-stone-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-semibold text-stone-700">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-xl border-stone-200 bg-white text-base placeholder:text-stone-300 focus:border-stone-400"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 text-sm font-semibold rounded-xl mt-2"
        style={{
          background: "oklch(0.14 0.018 48)",
          color: "white",
        }}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
