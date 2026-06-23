import { login } from "@/app/actions/auth";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in — Vedic Coffee" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">Vedic Coffee</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to continue</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <LoginForm action={login} />
        </div>
      </div>
    </div>
  );
}
