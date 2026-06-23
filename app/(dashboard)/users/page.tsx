import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "@/components/users/users-client";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const db = createAdminClient();

  const [{ data: users }, { data: authList }] = await Promise.all([
    db.from("users").select("*").order("name"),
    db.auth.admin.listUsers(),
  ]);

  // Map auth_id → email for display
  const emailByAuthId = Object.fromEntries(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const usersWithEmail = (users ?? []).map((u) => ({
    ...u,
    email: emailByAuthId[u.auth_id] ?? "",
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Users</h1>
      <UsersClient users={usersWithEmail} currentUser={user} />
    </div>
  );
}
