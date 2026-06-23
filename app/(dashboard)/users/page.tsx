import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "@/components/users/users-client";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("name");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Users</h1>
      <UsersClient users={users ?? []} currentUser={user} />
    </div>
  );
}
