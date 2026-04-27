"use client";

import { useState } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Activity, MapPin, CheckCircle, ShieldAlert, User as UserIcon, Clock, Search, Filter, AlertTriangle, Zap } from "lucide-react";
import { Incident } from "@/types";
import { toast } from "sonner";

export default function StaffDashboard() {
  const { incidents, loading, error } = useIncidents(); 
  const { userData } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [internalNote, setInternalNote] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");

  const acknowledgeIncident = async (incidentId: string) => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: "acknowledged",
        acknowledgedAt: Date.now(),
        updatedAt: Date.now(),
        timelineEvents: arrayUnion({
          type: "status_change",
          message: "Acknowledged by Staff Operations",
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success("Incident acknowledged.");
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(null);
      }
    } catch (e) {
      toast.error("Failed to acknowledge incident.");
      console.error(e);
    }
  };

  const addInternalNote = async (incidentId: string) => {
    if (!userData || !internalNote.trim()) return;
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        updatedAt: Date.now(),
        timelineEvents: arrayUnion({
          type: "note",
          message: `Internal Note: ${internalNote}`,
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success("Note added to incident log.");
      setInternalNote("");
    } catch {
      toast.error("Failed to add note.");
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

  const activeIncidents = incidents.filter(i => i.status !== "resolved");
  const resolvedIncidents = incidents.filter(i => i.status === "resolved");
  const awaitingAck = activeIncidents.filter(i => i.status === 'reported').length;
  const criticalAlerts = activeIncidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  const filteredIncidents = activeIncidents.filter(inc => {
    if (filterSeverity !== "All" && inc.severity !== filterSeverity) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      return (
        inc.incidentType.toLowerCase().includes(term) ||
        inc.location.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Premium Header */}
      <div id="staff-overview" className="scroll-mt-24 bg-[#0a1128] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3 tracking-tight">
              <Activity className="h-8 w-8 text-red-400" /> Venue Operations Console
            </h1>
            <p className="text-slate-400 font-medium">Monitor active alerts and coordinate initial response.</p>
          </div>
          <div className="flex gap-3">
            {awaitingAck > 0 && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-xl font-bold text-sm tracking-widest uppercase animate-pulse flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Action Required
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none bg-white shadow-sm border-slate-200">
          <CardContent className="p-5">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Open Incidents</p>
            <h3 className="text-3xl font-black text-slate-900">{activeIncidents.length}</h3>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-sm ${awaitingAck > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-white border-slate-200'}`}>
          <CardContent className="p-5">
            <p className={`font-black text-[10px] uppercase tracking-widest mb-1 ${awaitingAck > 0 ? 'text-orange-600' : 'text-slate-400'}`}>Awaiting Acknowledgment</p>
            <h3 className={`text-3xl font-black ${awaitingAck > 0 ? 'text-orange-700' : 'text-slate-900'}`}>{awaitingAck}</h3>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-sm ${criticalAlerts > 0 ? 'bg-red-50 border border-red-200' : 'bg-white border-slate-200'}`}>
          <CardContent className="p-5">
            <p className={`font-black text-[10px] uppercase tracking-widest mb-1 ${criticalAlerts > 0 ? 'text-red-600' : 'text-slate-400'}`}>High/Critical Alerts</p>
            <h3 className={`text-3xl font-black ${criticalAlerts > 0 ? 'text-red-700' : 'text-slate-900'}`}>{criticalAlerts}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm border-slate-200">
          <CardContent className="p-5">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Available Staff</p>
            <h3 className="text-3xl font-black text-slate-900">Active</h3>
          </CardContent>
        </Card>
      </div>

      <div id="live-incidents" className="scroll-mt-24 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
          <Input 
            placeholder="Search venue locations or incident types..." 
            className="pl-9 h-11 bg-white border-slate-200 shadow-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg p-2 px-3 h-11">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-900 dark:text-slate-100 w-full"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="All" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">All Severities</option>
            <option value="Critical" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Critical</option>
            <option value="High" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">High</option>
            <option value="Medium" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Medium</option>
            <option value="Low" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>
          <p className="mb-3 text-sm font-bold text-slate-500 dark:text-slate-400">Loading incident feed...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl border border-stone-200 bg-gradient-to-r from-stone-100 via-white to-stone-100 animate-pulse dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900" />)}
          </div>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
            <p className="font-bold text-lg mb-4">Live Sync Failed: {error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Reconnect to Core</Button>
          </CardContent>
        </Card>
      ) : activeIncidents.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm text-center py-20 rounded-3xl dark:bg-neutral-900 dark:border-neutral-800">
          <CheckCircle className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-700 dark:text-slate-100">No active incidents at the moment.</h3>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">The live incident feed will populate as new reports arrive.</p>
        </Card>
      ) : filteredIncidents.length === 0 ? (
        <Card className="bg-white border-slate-200 text-center py-16 rounded-3xl">
          <h3 className="text-xl font-black text-slate-700">No Matches Found</h3>
          <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.map(incident => (
            <Card key={incident.id} className="overflow-hidden border-slate-200 shadow-sm flex flex-col transition-shadow hover:shadow-xl rounded-2xl cursor-pointer group" onClick={() => setSelectedIncident(incident)}>
              <div className={`h-2 w-full ${incident.severity === 'Critical' ? 'bg-red-600 animate-pulse' : incident.severity === 'High' ? 'bg-orange-500' : incident.severity === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={getSeverityBadge(incident.severity)} className="font-bold px-3">
                    {incident.severity}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <h3 className="text-xl font-black mt-1 text-slate-900 group-hover:text-red-600 transition-colors">{incident.incidentType}</h3>
                
                <div className="flex items-center gap-2 text-slate-600 mt-3 text-sm bg-slate-50 p-3 rounded-xl font-bold border border-slate-100">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{incident.location}</span>
                </div>

                <div className="mt-5 text-sm text-slate-700 bg-gradient-to-br from-[#0a1128] to-slate-900 text-white p-4 rounded-xl line-clamp-3 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 p-2 opacity-20"><Zap className="h-10 w-10 text-red-400"/></div>
                  <span className="font-black text-red-400 mr-2 uppercase text-[10px] flex items-center gap-1 mb-2 tracking-widest">
                    <Zap className="h-3 w-3" /> AI Summary
                  </span>
                  <span className="font-medium">{incident.aiSummary}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                  <Badge variant={incident.status === 'reported' ? 'outline' : 'info'} className="capitalize font-bold flex-1 justify-center py-2 text-xs">
                    {incident.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section id="incident-history" className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Incident History</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved reports and completed operational reviews.</p>
          </div>
          <Badge variant="secondary" className="font-bold">{resolvedIncidents.length} resolved</Badge>
        </div>
        {resolvedIncidents.length === 0 ? (
          <Card className="border-dashed border-stone-300 bg-white/80 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="font-black text-slate-800 dark:text-slate-100">No resolved incident history yet.</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Completed incident records will appear here for review.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {resolvedIncidents.slice(0, 6).map(incident => (
              <Card key={incident.id} className="cursor-pointer border-stone-200 shadow-sm transition hover:shadow-md dark:border-neutral-800" onClick={() => setSelectedIncident(incident)}>
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
        title={
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${selectedIncident?.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-stone-500'}`}></div>
            <span className="font-black text-xl">Incident Details</span>
          </div>
        }
        className="max-w-3xl"
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precise Location</p>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><MapPin className="h-4 w-4 text-stone-500" />{selectedIncident.location}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporter</p>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><UserIcon className="h-4 w-4 text-stone-500" />{selectedIncident.reporterName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Description</p>
                <p className="text-sm bg-white p-4 rounded-xl border border-slate-200 text-slate-700 font-medium italic shadow-sm">
                  &quot;{selectedIncident.description}&quot;
                </p>
              </div>
            </div>

            <div className="bg-[#0a1128] border border-[#1a233a] p-6 rounded-2xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-24 w-24 text-red-400" /></div>
              <div className="relative z-10 flex items-center gap-2 mb-4 text-red-400 font-black tracking-widest uppercase text-xs">
                <Zap className="h-4 w-4" /> AI Operational Insights
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incident Summary</h4>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">{selectedIncident.aiSummary}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-2">Recommended Immediate Actions</h4>
                  <p className="text-sm whitespace-pre-wrap text-slate-200 font-medium">{selectedIncident.aiPlaybook}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-black text-slate-900 text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-red-600" /> Internal Notes
              </h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a note to the incident log..." 
                  className="bg-white border-slate-300 shadow-sm font-medium"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                />
                <Button className="bg-slate-800 hover:bg-slate-900 font-bold px-6" onClick={() => addInternalNote(selectedIncident.id)}>
                  Add Note
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Activity Log
              </h4>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {(selectedIncident.timelineEvents || []).slice().reverse().map((event, idx) => (
                  <div key={idx} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm ml-2 md:ml-0">
                      <p className="font-bold text-slate-900 text-xs">{event.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        {event.actorName} • {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedIncident.status === 'reported' && (
              <div className="pt-4 border-t border-slate-200 mt-6">
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 h-14 text-lg font-black shadow-lg"
                  onClick={() => acknowledgeIncident(selectedIncident.id)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" /> Acknowledge Incident
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
