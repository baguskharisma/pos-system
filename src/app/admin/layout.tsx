import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has admin access (ADMIN or SUPER_ADMIN)
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  if (!isAdmin) {
    redirect("/admin/forbidden");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader user={session.user} />
        <main className="p-6">
          <AdminLayoutClient userRole={session.user.role as "ADMIN" | "SUPER_ADMIN" | "CASHIER"}>
            {children}
          </AdminLayoutClient>
        </main>
      </div>
    </div>
  );
}
