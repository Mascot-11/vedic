import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const db = createAdminClient();
  const [{ data: settings }, { data: tables }] = await Promise.all([
    db.from("shop_settings").select("*").single(),
    db.from("tables").select("*").order("label"),
  ]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Settings</h1>
      <SettingsClient
        settings={settings}
        tables={tables ?? []}
        canEditShop={user.role === "superadmin" || user.role === "owner"}
      />
    </div>
  );
}
