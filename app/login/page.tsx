import { login } from "@/app/actions/auth";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in — Vedic Coffee" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — branding */}
      <div
        className="hidden md:flex md:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "oklch(0.14 0.018 48)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-10"
          style={{ background: "oklch(0.72 0.14 58)" }} />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-10"
          style={{ background: "oklch(0.72 0.14 58)" }} />

        <div className="relative z-10">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-8"
            style={{ background: "oklch(0.72 0.14 58)" }}>
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21v-2h2V4h14v2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2v6h2v2H2Zm4-2h8V6H6v13Zm10-5h2V8h-2v6Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">Vedic Coffee</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "oklch(0.62 0.01 55)" }}>
            Sales · Inventory · Credit
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { label: "Tables & Orders", desc: "Open tabs, add items, close bills" },
            { label: "Bean Inventory", desc: "Track brewing stock in real time" },
            { label: "Credit Tracking", desc: "Manage dues with full payment history" },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0"
                style={{ background: "oklch(0.72 0.14 58)" }} />
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.01 55)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.14 0.018 48)" }}>
              <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                <path d="M2 21v-2h2V4h14v2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2v6h2v2H2Zm4-2h8V6H6v13Zm10-5h2V8h-2v6Z"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-stone-900">Vedic Coffee</span>
          </div>

          <h2 className="text-2xl font-bold text-stone-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-stone-500">Sign in to continue to your dashboard</p>

          <div className="mt-8">
            <LoginForm action={login} />
          </div>
        </div>
      </div>
    </div>
  );
}
