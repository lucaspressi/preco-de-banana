import { requireAdmin } from "@/lib/admin-guard";

import { AdminSidebar } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Barreira definitiva: valida sessao e existencia do usuario no banco.
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[100rem] flex-col lg:flex-row">
        <AdminSidebar email={session.email} />

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
