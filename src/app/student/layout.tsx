import StudentSidebar from "./Sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
