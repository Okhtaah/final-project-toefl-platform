"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileEdit, 
  Files, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signout } from "../auth/actions";

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/courses", label: "Courses", icon: BookOpen },
    { href: "/student/exams", label: "Exams", icon: FileEdit },
    { href: "/student/materials", label: "Materials", icon: Files },
  ];

  return (
    <aside className={`relative flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && <span className="font-bold text-xl text-primary truncate">TOEFL Prep</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-foreground/70"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'text-foreground/70 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-4">
        <form action={signout}>
          <button className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 text-sm font-medium text-foreground/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all`}>
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </form>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3`}>
          {!collapsed && <span className="text-sm font-semibold">Theme</span>}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
