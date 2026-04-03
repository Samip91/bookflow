"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Activity } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Auth Guard: Kick unauthenticated users back to login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Activity className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  // Prevent flashing the dashboard before the redirect executes
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/30 font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle background glow for the main dashboard area */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
