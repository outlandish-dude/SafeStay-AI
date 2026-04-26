"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useIncidents } from "@/hooks/useIncidents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ShieldAlert, Activity, CheckCircle, PhoneCall, MapPin, BookOpen, UserCircle, RefreshCcw, AlertTriangle, Zap, Info, Clock, ShieldCheck, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Incident } from "@/types";

export default function GuestDashboard() {
  const { currentUser, userData } = useAuth();
  const { incidents, loading, error } = useIncidents(undefined, currentUser?.uid);
  
  const [isReporting, setIsReporting] = useState(false);
  const [incidentType, setIncidentType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const activeIncidents = incidents.filter(i => i.status !== "resolved");
  const latestActive = activeIncidents[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: currentUser?.uid,
          reporterName: userData?.name || currentUser?.email,
          reporterRole: userData?.role || "guest",
          incidentType,
          location,
          description
        })
      });

      if (!response.ok) throw new Error("Failed to report");
      
      toast.success("Emergency report submitted. Help is being notified.");
      setIsReporting(false);
      setIncidentType("");
      setLocation("");
      setDescription("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit report. Please try again or call emergency services.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSilentSOS = async () => {
    if(!confirm("Activate Silent SOS? This will immediately alert security to your location without making noise.")) return;
    setSubmitting(true);
    try {
      // In a real app we would use navigator.geolocation
      const fallbackLocation = "Last Known Location / Room"; 
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: currentUser?.uid,
          reporterName: userData?.name || currentUser?.email,
          reporterRole: userData?.role || "guest",
          incidentType: "Distress / Silent SOS",
          location: fallbackLocation,
          description: "GUEST ACTIVATED SILENT SOS. IMMEDIATE ATTENTION REQUIRED."
        })
      });

      if (!response.ok) throw new Error("Failed to report");
      toast.success("Silent SOS Activated. Security is on the way.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit SOS. Call 100 immediately.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallSecurity = () => {
    toast.warning("Simulating call to Security...");
    setTimeout(() => toast.success("Security team contacted."), 1500);
  };

  const handleShareLocation = () => {
    navigator.clipboard.writeText(`SafeStay AI - Emergency Location Share: I am at ${location || "my room"}.`);
    toast.success("Location copied to clipboard to share.");
  };

  const handleContactDesk = () => {
    toast.info("Front Desk has been pinged. They will contact you shortly.");
  };

  const getStatusBanner = (status: string) => {
    switch(status) {
      case 'reported': return <div className="bg-orange-100 text-orange-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><Clock className="h-4 w-4 animate-spin-slow" /> Your report is being reviewed.</div>;
      case 'acknowledged': return <div className="bg-blue-100 text-blue-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4" /> Staff has acknowledged. Help is organizing.</div>;
      case 'assigned': return <div className="bg-indigo-100 text-indigo-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><UserCircle className="h-4 w-4" /> A responder has been assigned.</div>;
      case 'en_route': return <div className="bg-purple-100 text-purple-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><Activity className="h-4 w-4 animate-pulse" /> Responder is En Route to your location.</div>;
      case 'in_progress': return <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><Zap className="h-4 w-4 animate-pulse" /> Emergency is currently being handled.</div>;
      case 'resolved': return <div className="bg-green-100 text-green-800 p-3 rounded-lg flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4" /> Incident has been resolved. Stay safe.</div>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Premium Hero Status Card */}
      <div className="relative overflow-hidden bg-[#0a1128] text-white p-8 md:p-10 rounded-3xl shadow-2xl border border-[#1a233a]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Emergency Assist</h1>
            <p className="text-blue-200 font-medium text-lg">
              {activeIncidents.length === 0 ? "No active emergencies reported by you." : `${activeIncidents.length} active incident(s) under response.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button 
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-900/50 border-0 h-14 px-8 rounded-2xl text-lg font-black w-full md:w-auto transition-transform active:scale-95 flex items-center gap-3"
              onClick={() => setIsReporting(true)}
            >
              <ShieldAlert className="h-6 w-6" />
              Report Emergency
            </Button>
            <Button 
              className="bg-black hover:bg-slate-900 border-2 border-red-500/30 hover:border-red-500/50 text-red-500 shadow-xl shadow-black h-12 px-8 rounded-2xl text-sm font-black w-full md:w-auto transition-all active:scale-95 flex items-center justify-center gap-2"
              onClick={handleSilentSOS}
              disabled={submitting}
            >
              <AlertTriangle className="h-4 w-4" />
              Silent SOS
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Incident Spotlight */}
          {latestActive && (
            <Card className="border-2 border-indigo-200 shadow-lg overflow-hidden">
              <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center">
                <span className="font-black text-indigo-900 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600 animate-pulse" /> Live Status
                </span>
                <span className="text-xs font-bold text-indigo-400">ID: {latestActive.id.slice(-6).toUpperCase()}</span>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{latestActive.incidentType}</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" /> {latestActive.location}</p>
                  </div>
                  <Badge variant="destructive" className="font-bold px-3 py-1 text-sm animate-pulse">ACTIVE</Badge>
                </div>
                
                {getStatusBanner(latestActive.status)}

                {latestActive.aiSafetyGuidance && (
                  <div className="mt-6 bg-gradient-to-br from-slate-900 to-[#0a1128] text-white p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-16 w-16" /></div>
                    <div className="relative z-10">
                      <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap className="h-3 w-3" /> AI Safety Guidance
                      </h4>
                      <p className="font-medium leading-relaxed">{latestActive.aiSafetyGuidance}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Reports List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-900">Incident History</h2>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="font-bold text-slate-500 hover:bg-slate-200">
                <RefreshCcw className="h-4 w-4 mr-2" /> Sync
              </Button>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />)}
              </div>
            ) : error ? (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="flex flex-col items-center justify-center py-10 text-red-500">
                  <AlertTriangle className="h-10 w-10 mb-3 text-red-400" />
                  <p className="font-bold text-center mb-4">Connection interrupted: {error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
                </CardContent>
              </Card>
            ) : incidents.length === 0 ? (
              <Card className="bg-white border-slate-200 shadow-sm text-center py-12 rounded-2xl">
                <ShieldCheck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-700">All Clear</h3>
                <p className="text-slate-500 font-medium">You have no incident history.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {incidents.filter(i => i.id !== latestActive?.id).map(incident => (
                  <Card key={incident.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                    <div className="p-5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={incident.status === 'resolved' ? 'success' : 'outline'} className="font-bold text-[10px] uppercase tracking-wider">
                            {incident.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(incident.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-black text-slate-900">{incident.incidentType}</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="font-bold text-blue-600">Details</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900 uppercase tracking-wide text-sm">Quick Actions</h2>
            </div>
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                <button onClick={handleCallSecurity} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-left font-bold text-slate-700 w-full group">
                  <div className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  Call Security
                </button>
                <button onClick={handleShareLocation} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-left font-bold text-slate-700 w-full group">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  Share Location
                </button>
                <button onClick={() => setShowSafetyTips(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-left font-bold text-slate-700 w-full group">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Safety Handbook
                </button>
                <button onClick={handleContactDesk} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-left font-bold text-slate-700 w-full group">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  Front Desk
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl bg-blue-50/50">
            <CardContent className="p-6">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Info className="h-5 w-5 text-blue-600" /> What Happens Next?</h3>
              <ul className="space-y-3 text-sm font-medium text-slate-600">
                <li className="flex gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  Staff are instantly notified and AI analyzes the severity.
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  A trained responder is assigned to your location.
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  You will see live status updates right on this dashboard.
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modals remain mostly the same structurally but UI updated */}
      <Modal 
        isOpen={isReporting} 
        onClose={() => !submitting && setIsReporting(false)}
        title={
          <div className="flex items-center gap-2 text-red-600 font-black">
            <ShieldAlert className="h-6 w-6" /> Declare Emergency
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["Fire", "Medical", "Assault", "Gas Leak", "Suspicious Activity", "Other"].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`p-3 rounded-xl border-2 font-bold transition-all ${
                    incidentType === type 
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm ring-2 ring-red-500/20' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  onClick={() => setIncidentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Precise Location</label>
            <Input 
              required 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              placeholder="e.g. Room 402, Main Lobby" 
              className="bg-slate-50 border-slate-200 h-12 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Context & Details (Optional)</label>
            <textarea 
              className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[120px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the situation..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="font-bold" onClick={() => setIsReporting(false)}>Cancel</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 font-bold px-8 h-12" disabled={!incidentType || !location || submitting}>
              {submitting ? "Transmitting..." : "Submit Alert"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showSafetyTips} onClose={() => setShowSafetyTips(false)} title={<span className="font-black">Safety Handbook</span>}>
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
            <h4 className="font-black text-orange-800 uppercase text-xs tracking-wider mb-1">Fire Protocol</h4>
            <p className="text-sm font-medium text-orange-900">Do not use elevators. Feel doors for heat before opening. Crawl low under smoke.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <h4 className="font-black text-blue-800 uppercase text-xs tracking-wider mb-1">Medical Protocol</h4>
            <p className="text-sm font-medium text-blue-900">Call 100 immediately if life-threatening. Do not move injured persons unless in immediate danger.</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">Evacuation Protocol</h4>
            <p className="text-sm font-medium text-slate-700">Follow exit signs. Meet at designated assembly points. Do not return until cleared.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedIncident} onClose={() => setSelectedIncident(null)} title={<span className="font-black">Report Archive</span>}>
        {selectedIncident && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <Badge variant="outline" className="capitalize font-bold bg-white">{selectedIncident.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                <p className="font-bold text-slate-800 text-sm">{new Date(selectedIncident.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Details</p>
                <p className="font-bold text-slate-800 text-sm">{selectedIncident.incidentType} at {selectedIncident.location}</p>
              </div>
            </div>
            
            {selectedIncident.aiSafetyGuidance && (
              <div className="bg-[#0a1128] text-white p-5 rounded-2xl relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-16 w-16" /></div>
                <div className="relative z-10">
                  <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Zap className="h-3 w-3" /> AI Analysis Log
                  </h4>
                  <p className="text-sm font-medium leading-relaxed">{selectedIncident.aiSafetyGuidance}</p>
                </div>
              </div>
            )}

            {selectedIncident.aiPostIncidentRecap && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-2xl shadow-sm">
                <h4 className="text-emerald-700 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" /> Post-Incident AI Recap
                </h4>
                <p className="text-sm font-medium leading-relaxed">{selectedIncident.aiPostIncidentRecap}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {selectedIncident.id}</p>
              <Button size="sm" variant="outline" className="font-bold text-xs" onClick={() => {
                navigator.clipboard.writeText(selectedIncident.id);
                toast.success("Reference ID copied to clipboard.");
              }}>
                <Copy className="h-3 w-3 mr-1" /> Copy ID
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
