import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. NEVER expose to the browser.
// Only import this in Server Actions, Route Handlers, or Server Components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!key || key === "your_service_role_key_here") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
