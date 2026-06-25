"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { logout } from "@/app/actions/auth";

interface Props {
  action: (formData: FormData) => Promise<{ error: string } | { success: true; rememberMe: boolean }>;
}

export default function LoginForm({ action }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  useEffect(() => {
    if (!state || !("success" in state)) return;

    if (!state.rememberMe) {
      // Mark session as non-persistent
      sessionStorage.setItem("no_persist_session", "1");
    } else {
      sessionStorage.removeItem("no_persist_session");
    }

    router.push("/");
    router.refresh();
  }, [state, router]);

  // On mount: if previous session was non-persistent and tab was re-opened, sign out
  useEffect(() => {
    if (sessionStorage.getItem("no_persist_session")) {
      sessionStorage.removeItem("no_persist_session");
      logout().then(() => router.refresh());
    }
  }, [router]);

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
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl border-stone-200 bg-white text-base placeholder:text-stone-300 focus:border-stone-400 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          name="remember_me"
          defaultChecked
          className="h-4 w-4 rounded border-stone-300 accent-stone-900 cursor-pointer"
        />
        <span className="text-sm text-stone-600">Remember me</span>
      </label>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 text-sm font-semibold rounded-xl"
        style={{ background: "oklch(0.14 0.018 48)", color: "white" }}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </span>
        ) : "Sign in"}
      </Button>
    </form>
  );
}
