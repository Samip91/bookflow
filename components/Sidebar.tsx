"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, Briefcase, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Briefcase },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <aside className="h-screen w-64 bg-white border-r border-slate-200 flex-col justify-between hidden md:flex sticky top-0 shrink-0">
      <div>
        {/* Brand */}
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 shadow-sm flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-xl tracking-tight">Bookflow</span>
          </div>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  isActive
                    ? "bg-blue-50/80 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium text-sm group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
          Logout
        </button>
      </div>
    </aside>
  );
}
