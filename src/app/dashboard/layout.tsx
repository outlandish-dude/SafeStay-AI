"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldCheck, LogOut, UserCircle, Activity, Globe, Zap, Radio } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { BroadcastBanner } from "@/components/BroadcastBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  const getRoleTitle = (role: string | undefined) => {
    switch(role) {
      case 'admin': return "Crisis Command Center";
      case 'staff': return "Venue Operations Console";
      case 'responder': return "Field Response Console";
      case 'guest': return "Emergency Assist";
      default: return "Dashboard";
    }
  };

  const getRoleIcon = (role: string | undefined) => {
    switch(role) {
      case 'admin': return <Globe className="h-5 w-5" />;
      case 'staff': return <Activity className="h-5 w-5" />;
      case 'responder': return <Zap className="h-5 w-5" />;
      case 'guest': return <ShieldCheck className="h-5 w-5" />;
      default: return <Radio className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar - Premium Navy Aesthetic */}
      <aside className="w-full md:w-72 bg-[#0a1128] text-slate-300 md:min-h-screen flex flex-col md:fixed border-r border-[#1a233a] shadow-2xl z-50">
        <div className="p-6 text-white flex items-center justify-between border-b border-[#1a233a] bg-[#0a1128]/80 backdrop-blur-md">
          <div className="flex items-center gap-3 font-black text-2xl">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="tracking-tight">SafeStay<span className="text-blue-500">AI</span></span>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="relative">
              <UserCircle className="h-12 w-12 text-slate-400" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a1128]"></div>
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{userData?.name || currentUser.email}</p>
              <p className="text-xs uppercase tracking-widest text-blue-400 font-bold mt-1">
                {userData?.role || 'Guest'}
              </p>
            </div>
          </div>
          
          <nav className="space-y-3">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600/20 to-transparent text-blue-400 rounded-xl font-bold border-l-4 border-blue-500 flex items-center gap-3 shadow-inner">
              {getRoleIcon(userData?.role)}
              {getRoleTitle(userData?.role)}
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#1a233a] bg-black/10">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-all w-full font-medium group"
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Secure Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 md:pt-10 min-h-screen relative dark:bg-slate-950">
        <BroadcastBanner />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 -z-10" />
        {children}
      </main>
    </div>
  );
}
