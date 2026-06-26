import AdminSidebar from "./Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
