import { createClient } from "@/utils/supabase/server";
import { promoteToAdmin } from "./actions";
import Link from "next/link";
import { Users, ShieldAlert, PlusCircle, LayoutDashboard, BookOpen } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Admin Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Total Users</h2>
          </div>
          <p className="text-4xl font-bold">{profiles?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Management */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </h3>
            <p className="text-sm text-foreground/60">View all registered students and assign admin roles.</p>
          </div>
          
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-foreground/70">Profile ID</th>
                  <th className="px-6 py-3 font-medium text-foreground/70">Role</th>
                  <th className="px-6 py-3 font-medium text-foreground/70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {profiles?.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-foreground/80">{profile.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        profile.role === 'admin' 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {profile.role === 'student' && (
                        <form action={promoteToAdmin}>
                          <input type="hidden" name="userId" value={profile.id} />
                          <button 
                            className="text-xs bg-inherit border border-gray-300 dark:border-gray-700 hover:border-primary hover:text-primary px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ml-auto"
                            title="Promote to Admin"
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Promote
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-foreground/50">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links Placeholder */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/courses" className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300">
            <LayoutDashboard className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-bold mb-2">Manage Courses</h3>
            <p className="text-sm text-foreground/70">Create modules, passages, and testing questions.</p>
          </Link>

          <div className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300">
            <BookOpen className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-bold mb-2">Access Codes</h3>
            <p className="text-sm text-foreground/70">Generate and distribute access codes to students.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
