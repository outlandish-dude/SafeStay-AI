"use client";

import { useState } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { MapPin, CheckCircle, Zap, Target, Activity, Send, BookOpen, History } from "lucide-react";
import { Incident } from "@/types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function ResponderDashboard() {
  const { currentUser, userData } = useAuth();
  const { incidents, loading } = useIncidents(currentUser?.uid);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [progressNote, setProgressNote] = useState("");

  const updateStatus = async (incidentId: string, status: string, customMessage?: string) => {
    if (!userData) return;
    try {
      const message = customMessage || (status === 'resolved' ? 'Mission accomplished and resolved.' : 'Status updated to ' + status.replace('_', ' '));
      
      await updateDoc(doc(db, "incidents", incidentId), {
        status,
        updatedAt: Date.now(),
        ...(status === 'resolved' ? { resolvedAt: Date.now() } : {}),
        timelineEvents: arrayUnion({
          type: "status_change",
          message,
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success(message);
      if (selectedIncident?.id === incidentId && status === 'resolved') {
        setSelectedIncident(null);
      }
    } catch {
      toast.error("Failed to update mission status.");
    }
  };

  const addProgressUpdate = async (incidentId: string) => {
    if (!userData || !progressNote.trim()) return;
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        updatedAt: Date.now(),
        timelineEvents: arrayUnion({
          type: "note",
          message: `Update: ${progressNote}`,
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success("Progress update transmitted.");
      setProgressNote("");
    } catch {
      toast.error("Failed to transmit update.");
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical": return "destructive";
      case "High": return "warning";
      case "Medium": return "info";
      default: return "secondary";
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-stone-100 dark:bg-neutral-950">
      <div className="w-full max-w-lg space-y-3 p-6">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading assignment queue...</p>
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl border border-stone-200 bg-gradient-to-r from-stone-100 via-white to-stone-100 animate-pulse dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900" />)}
      </div>
    </div>
  );

  const assignedIncidents = incidents.filter(i => i.status !== "resolved");
  const resolvedIncidents = incidents.filter(i => i.status === "resolved");
  const enRouteCount = assignedIncidents.filter(i => i.status === 'en_route').length;
  const inProgressCount = assignedIncidents.filter(i => i.status === 'in_progress').length;
  const resolvedToday = incidents.filter(i => i.status === "resolved" && (Date.now() - i.resolvedAt!) < 86400000).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      
      <div id="responder-overview" className="scroll-mt-24 bg-[#0a1128] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3 tracking-tight">
              <Zap className="h-8 w-8 text-red-400" /> Field Response Console
            </h1>
            <p className="text-slate-400 font-medium">Tactical mission tracking and emergency response.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 font-bold text-sm tracking-widest uppercase">
            Unit: {userData?.name || "Alpha-1"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none bg-slate-800 text-white shadow-md">
          <CardContent className="p-5">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Active Missions</p>
            <h3 className="text-3xl font-black">{assignedIncidents.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-red-600 text-white shadow-md">
          <CardContent className="p-5">
            <p className="text-stone-200 font-black text-[10px] uppercase tracking-widest mb-1">En Route</p>
            <h3 className="text-3xl font-black">{enRouteCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-orange-500 text-white shadow-md">
          <CardContent className="p-5">
            <p className="text-orange-200 font-black text-[10px] uppercase tracking-widest mb-1">In Progress</p>
            <h3 className="text-3xl font-black">{inProgressCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-emerald-500 text-white shadow-md">
          <CardContent className="p-5">
            <p className="text-emerald-200 font-black text-[10px] uppercase tracking-widest mb-1">Resolved Today</p>
            <h3 className="text-3xl font-black">{resolvedToday}</h3>
          </CardContent>
        </Card>
      </div>

      <section id="assigned-missions" className="scroll-mt-24">
      {assignedIncidents.length === 0 ? (
        <Card className="bg-slate-50 border-dashed text-center py-16 rounded-3xl dark:bg-neutral-900 dark:border-neutral-800">
          <CheckCircle className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-700 dark:text-slate-100">No assignments currently pending.</h3>
          <p className="text-slate-500 font-medium dark:text-slate-400">Assigned incidents and response actions will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignedIncidents.map(incident => (
            <Card key={incident.id} className="overflow-hidden border-slate-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
              <div className={`h-2 w-full ${incident.severity === 'Critical' ? 'bg-red-600' : 'bg-red-600'}`} />
              <div className="flex flex-col md:flex-row">
                
                {/* Left Side: Mission Details */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant={getSeverityBadge(incident.severity)} className="mb-2 font-bold px-3">
                        {incident.severity}
                      </Badge>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{incident.incidentType}</h3>
                    </div>
                    <Badge variant={incident.status === 'in_progress' ? 'warning' : 'outline'} className="capitalize font-bold">
                      {incident.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-700 mb-6 bg-slate-50 p-4 rounded-xl font-bold border border-slate-100">
                    <MapPin className="h-5 w-5 text-stone-500 shrink-0" />
                    Target: {incident.location}
                  </div>

                  <div className="mb-4 bg-slate-900 text-white p-5 rounded-xl">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" /> Tactical Playbook
                    </h4>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {incident.aiPlaybook || "Proceed with standard operating protocol."}
                    </p>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div className="w-full md:w-72 p-6 bg-slate-50 flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Mission Controls</h4>
                    
                    {incident.status === 'assigned' || incident.status === 'acknowledged' ? (
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 h-12 text-md font-black shadow-md"
                        onClick={() => updateStatus(incident.id, 'en_route', 'Responder acknowledged and is En Route.')}
                      >
                        Accept & En Route
                      </Button>
                    ) : null}

                    {incident.status === 'en_route' && (
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-md font-black shadow-md"
                        onClick={() => updateStatus(incident.id, 'in_progress', 'Responder arrived on scene. In Progress.')}
                      >
                        Mark On Scene
                      </Button>
                    )}

                    {incident.status === 'in_progress' && (
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-md font-black shadow-md"
                        onClick={() => updateStatus(incident.id, 'resolved', 'Target secured. Mission resolved.')}
                      >
                        Declare Resolved
                      </Button>
                    )}
                    
                    <Button variant="outline" className="w-full font-bold border-slate-300" onClick={() => setSelectedIncident(incident)}>
                      Open Comms & Log
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </section>

      <section id="ai-playbooks" className="scroll-mt-24 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-red-600 dark:bg-white/10 dark:text-red-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">AI Playbooks</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Fast response guidance for common field scenarios.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Fire Alert", "Evacuate the zone, avoid elevators, isolate the area, and report smoke or heat conditions."],
            ["Medical Emergency", "Assess responsiveness, call 112 for life-threatening cases, keep pathways clear, and update operations."],
            ["Security Threat", "Keep distance, avoid confrontation, preserve scene details, and wait for coordinated support."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="mission-history" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Mission History</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed assignments for this responder unit.</p>
          </div>
        </div>
        {resolvedIncidents.length === 0 ? (
          <Card className="border-dashed border-stone-300 bg-white/80 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="font-black text-slate-800 dark:text-slate-100">No completed missions yet.</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Resolved assignments will appear here after closure.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {resolvedIncidents.slice(0, 6).map(incident => (
              <Card key={incident.id} className="border-stone-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white">{incident.incidentType}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{incident.location}</p>
                    </div>
                    <Badge variant="success" className="font-bold">Resolved</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={<span className="font-black flex items-center gap-2"><Activity className="h-5 w-5 text-red-600"/> Mission Log & Comms</span>}
        className="max-w-2xl"
      >
        {selectedIncident && (
          <div className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-black text-slate-900 text-xs tracking-widest uppercase mb-3">Transmit Update</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Situation report..." 
                  className="bg-white border-slate-300"
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProgressUpdate(selectedIncident.id)}
                />
                <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => addProgressUpdate(selectedIncident.id)}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Audit Trail</h4>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {(selectedIncident.timelineEvents || []).slice().reverse().map((event, idx) => (
                  <div key={idx} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-stone-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm ml-2 md:ml-0">
                      <p className="font-bold text-slate-900 text-sm">{event.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        {event.actorName} • {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
