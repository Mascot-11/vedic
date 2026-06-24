import { getCurrentUser } from "@/lib/auth";
import AccountClient from "@/components/account/account-client";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-xl font-semibold text-stone-900 mb-1">My Account</h1>
      <p className="text-sm text-stone-500 mb-6">Manage your password and profile.</p>
      <AccountClient user={user!} />
    </div>
  );
}
