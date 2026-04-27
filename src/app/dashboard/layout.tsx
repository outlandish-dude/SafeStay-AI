"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, LogOut, UserCircle, Activity, Globe, Zap, ShieldX, BookOpen, Clock, ListChecks, Users, BarChart3, Siren, ClipboardList, History, UserCog, HeartHandshake, PhoneCall } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { canAccessDashboard, roleHome } from "@/lib/access-control";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, loading, router]);

  const navItems = useMemo(() => {
    switch (userData?.role) {
      case "admin":
        return [
          { id: "command-center", label: "Crisis Command Center", icon: Globe },
          { id: "operations-queue", label: "Operations Queue", icon: ListChecks },
          { id: "user-management", label: "User Management", icon: Users },
          { id: "responder-control", label: "Responder Control", icon: UserCog },
          { id: "analytics-insights", label: "Analytics & Insights", icon: BarChart3 },
        ];
      case "staff":
        return [
          { id: "staff-overview", label: "Venue Operations Console", icon: Activity },
          { id: "live-incidents", label: "Live Incidents", icon: Siren },
          { id: "incident-history", label: "Incident History", icon: History },
        ];
      case "responder":
        return [
          { id: "responder-overview", label: "Field Response Console", icon: Zap },
          { id: "assigned-missions", label: "Assigned Missions", icon: ClipboardList },
          { id: "mission-history", label: "Mission History", icon: History },
          { id: "ai-playbooks", label: "AI Playbooks", icon: BookOpen },
        ];
      case "guest":
      default:
        return [
          { id: "emergency-assist", label: "Emergency Assist", icon: HeartHandshake },
          { id: "recent-reports", label: "Recent Reports", icon: Clock },
          { id: "safety-handbook", label: "Safety Handbook", icon: BookOpen },
          { id: "quick-contacts", label: "Quick Contacts", icon: PhoneCall },
        ];
    }
  }, [userData?.role]);

  useEffect(() => {
    setActiveSection(navItems[0]?.id || "");
  }, [navItems]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!loading && userData && !canAccessDashboard(userData, pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-6 text-slate-950 dark:bg-neutral-950 dark:text-white">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <ShieldX className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-black">Access denied</h1>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Your verified role does not have permission to open this workspace.</p>
          <Button className="mt-6 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-neutral-950" onClick={() => router.push(roleHome(userData.role))}>
            Return to your dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row font-sans selection:bg-red-600 selection:text-white dark:bg-neutral-950">
      <aside className="w-full md:w-72 bg-white text-slate-700 md:min-h-screen flex flex-col md:fixed border-r border-stone-200 shadow-xl z-50 dark:bg-neutral-950 dark:text-slate-300 dark:border-neutral-800">
        <div className="p-6 text-slate-950 flex items-center justify-between border-b border-stone-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-white">
          <div className="flex items-center gap-3 font-black text-2xl">
            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg dark:bg-white">
              <ShieldCheck className="h-6 w-6 text-white dark:text-neutral-950" />
            </div>
            <span className="tracking-tight">SafeStay<span className="text-red-600">AI</span></span>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-stone-100 border border-stone-200 backdrop-blur-sm dark:bg-white/5 dark:border-white/10">
            <div className="relative">
              <UserCircle className="h-12 w-12 text-slate-400" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-950"></div>
            </div>
            <div>
              <p className="font-bold text-slate-950 leading-tight dark:text-white">{userData?.name || currentUser.email}</p>
              <p className="text-xs uppercase tracking-widest text-red-600 dark:text-red-400 font-bold mt-1">
                {userData?.role || 'Guest'}
              </p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all flex items-center gap-3 border ${
                    active
                      ? "bg-stone-100 text-slate-950 border-stone-200 shadow-inner dark:bg-white/10 dark:text-white dark:border-white/10"
                      : "text-slate-600 border-transparent hover:bg-stone-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-red-600 dark:text-red-400" : "text-slate-400"}`} />
                  <span className="leading-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-stone-200 bg-stone-50 dark:border-neutral-800 dark:bg-black/20">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 text-slate-600 hover:text-red-600 transition-all w-full font-medium group dark:text-slate-400 dark:hover:text-white"
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Secure Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 md:pt-10 min-h-screen relative dark:bg-neutral-950">
        <BroadcastBanner />
        <div className="absolute inset-0 bg-stone-100 dark:bg-neutral-950 -z-10" />
        {children}
      </main>
    </div>
  );
}
