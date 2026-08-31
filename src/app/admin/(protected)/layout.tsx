import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getUnreadMessageCount } from "@/lib/data";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Toutes les pages sous (protected) exigent une session admin valide
 * (cookie signé — voir src/lib/auth.ts).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let unreadCount = 0;
  try {
    unreadCount = await getUnreadMessageCount();
  } catch {
    unreadCount = 0;
  }

  return (
    <AdminShell
      userLabel={process.env.ADMIN_USERNAME ?? "admin"}
      unreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  );
}
