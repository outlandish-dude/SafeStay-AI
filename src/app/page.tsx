import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-950 font-[family-name:var(--font-geist-sans)]">
      <header className="flex h-16 items-center px-4 sm:px-8 border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
          <ShieldCheck className="h-6 w-6" />
          <span>SafeStay AI</span>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" className="font-semibold text-slate-700">Login</Button>
          </Link>
          <Link href="/auth">
            <Button className="font-semibold bg-blue-600 hover:bg-blue-700">Try Demo</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 mb-8 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
          Emergency Coordination Platform for Hospitality
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl text-slate-900 mb-6 leading-tight">
          Detect faster. <span className="text-blue-600">Respond smarter.</span> Save lives.
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed text-balance">
          SafeStay AI instantly connects guests, staff, and responders during critical incidents. Powered by Gemini AI to classify severity and guide immediate action when every second counts.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold shadow-lg bg-blue-600 hover:bg-blue-700 gap-2">
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Reporting</h3>
            <p className="text-slate-600">Guests and staff can quickly report fires, medical emergencies, or security issues.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Triage</h3>
            <p className="text-slate-600">Gemini AI automatically classifies incident severity and generates action playbooks.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Sync</h3>
            <p className="text-slate-600">All responders get live updates, status tracking, and coordinated assignments instantly.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 border-t bg-white text-sm">
        <p>© {new Date().getFullYear()} SafeStay AI. Solution Challenge Prototype.</p>
      </footer>
    </div>
  );
}
