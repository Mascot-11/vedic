export const revalidate = 300;

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "@/components/users/users-client";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const db = createAdminClient();
  const usersQuery = db.from("users").select("*").order("name");
  if (user.role === "owner") usersQuery.neq("role", "superadmin");

  const [{ data: users }, { data: authList }] = await Promise.all([
    usersQuery,
    db.auth.admin.listUsers(),
  ]);

  const emailByAuthId = Object.fromEntries(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const usersWithEmail = (users ?? []).map((u) => ({
    ...u,
    email: emailByAuthId[u.auth_id] ?? "",
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-stone-900 mb-5">Users</h1>
      <UsersClient users={usersWithEmail} currentUser={user} />
    </div>
  );
}
