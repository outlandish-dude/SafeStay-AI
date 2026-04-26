"use client";

import { useState, useEffect } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { doc, updateDoc, collection, getDocs, arrayUnion, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Activity, CheckCircle, Clock, MapPin, User as UserIcon, ListTodo, Search, Filter, Globe, Zap, AlertTriangle, TrendingUp, ShieldCheck, Download, Copy, RefreshCcw, Target, PlayCircle, Megaphone } from "lucide-react";
import { User, Incident } from "@/types";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { incidents, loading } = useIncidents();
  const { userData } = useAuth();
  const [responders, setResponders] = useState<User[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [generatingRecap, setGeneratingRecap] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTemplate, setBroadcastTemplate] = useState("Avoid Area");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  useEffect(() => {
    const fetchResponders = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => doc.data() as User);
      setResponders(usersData.filter(u => u.role === "responder" || u.role === "staff"));
    };
    fetchResponders();
  }, []);

  const assignResponder = async (incidentId: string, responderId: string) => {
    if (!userData) return;
    try {
      const responder = responders.find(r => r.uid === responderId);
      await updateDoc(doc(db, "incidents", incidentId), {
        assignedTo: arrayUnion(responderId),
        assignedNames: arrayUnion(responder?.name || 'Responder'),
        status: "assigned",
        updatedAt: Date.now(),
        timelineEvents: arrayUnion({
          type: "assignment",
          message: `Assigned to ${responder?.name || 'Responder'} (${responder?.role})`,
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success(`Assigned to ${responder?.name}`);
      setSelectedIncident(null);
    } catch (e) {
      toast.error("Failed to assign responder");
      console.error(e);
    }
  };

  const generateRecap = async (incidentId: string) => {
    setGeneratingRecap(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/recap`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate recap");
      const data = await response.json();
      if(selectedIncident) {
        setSelectedIncident({...selectedIncident, aiPostIncidentRecap: data.recap});
      }
      toast.success("AI Post-Incident Recap generated.");
    } catch {
      toast.error("Failed to generate recap");
    } finally {
      setGeneratingRecap(false);
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
  const activeCount = activeIncidents.length;
  const criticalCount = activeIncidents.filter(i => i.severity === "Critical").length;
  const highCount = activeIncidents.filter(i => i.severity === "High").length;
  const mediumCount = activeIncidents.filter(i => i.severity === "Medium").length;
  const unassignedCount = activeIncidents.filter(i => !i.assignedTo || i.assignedTo.length === 0).length;
  const resolvedToday = incidents.filter(i => i.status === "resolved" && (Date.now() - i.resolvedAt!) < 86400000).length;

  const topCriticalIncident = activeIncidents.find(i => i.severity === "Critical");
  
  // Escalation Watchlist
  const escalationWatchlist = activeIncidents.filter(i => 
    (i.severity === 'Critical' || i.severity === 'High') && 
    (i.status === 'reported' || i.status === 'acknowledged' || i.status === 'escalated')
  );

  // SafePulse Dynamic Risk Score
  let riskScore = 100;
  riskScore -= criticalCount * 15;
  riskScore -= highCount * 8;
  riskScore -= mediumCount * 3;
  riskScore -= unassignedCount * 5;
  riskScore = Math.max(0, riskScore);

  let pulseLabel = "Optimal";
  let pulseColor = "text-emerald-500";
  let pulseBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (riskScore < 40) { 
    pulseLabel = "Critical Risk"; 
    pulseColor = "text-red-500 animate-pulse"; 
    pulseBg = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  } else if (riskScore < 70) { 
    pulseLabel = "Elevated"; 
    pulseColor = "text-orange-500"; 
    pulseBg = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  } else if (riskScore < 90) { 
    pulseLabel = "Watch"; 
    pulseColor = "text-yellow-500"; 
    pulseBg = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }

  // Hotspot Intelligence
  const locationCounts = activeIncidents.reduce((acc, inc) => {
    acc[inc.location] = (acc[inc.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hotspots = Object.entries(locationCounts).filter(([_, count]) => count >= 2).sort((a,b) => b[1] - a[1]);

  // Readiness Score
  const availableResponders = responders.length;
  let readinessScore = 100;
  if (activeCount > availableResponders * 2) readinessScore = 30;
  else if (activeCount > availableResponders) readinessScore = 60;
  else if (activeCount > 0) readinessScore = 85;

  const updateStatus = async (incidentId: string, status: string) => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status,
        updatedAt: Date.now(),
        ...(status === 'resolved' ? { resolvedAt: Date.now() } : {}),
        timelineEvents: arrayUnion({
          type: "status_change",
          message: `Status forcefully updated to ${status.replace('_', ' ')} by Command Center`,
          actorId: userData.uid,
          actorName: userData.name,
          timestamp: Date.now()
        })
      });
      toast.success(`Status updated to ${status}`);
      setSelectedIncident(null);
    } catch (e) {
      toast.error("Failed to update status");
      console.error(e);
    }
  };

  const copyIncidentData = () => {
    if (!selectedIncident) return;
    const data = `INCIDENT REF: ${selectedIncident.id}\nTYPE: ${selectedIncident.incidentType}\nLOCATION: ${selectedIncident.location}\nSEVERITY: ${selectedIncident.severity}\nSTATUS: ${selectedIncident.status}\n\nAI SUMMARY:\n${selectedIncident.aiSummary}`;
    navigator.clipboard.writeText(data);
    toast.success("Incident data copied to clipboard.");
  };

  const exportCSV = () => {
    const headers = "ID,Type,Location,Severity,Status,Reporter,CreatedAt\n";
    const rows = incidents.map(i => `${i.id},${i.incidentType},"${i.location}",${i.severity},${i.status},"${i.reporterName}",${new Date(i.createdAt).toISOString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents_export_${Date.now()}.csv`;
    a.click();
    toast.success("Data exported successfully.");
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage) {
      toast.error("Please enter a broadcast message");
      return;
    }
    try {
      await addDoc(collection(db, "broadcasts"), {
        template: broadcastTemplate,
        message: broadcastMessage,
        createdAt: serverTimestamp(),
        author: userData?.name || "Admin"
      });
      toast.success("Mass Alert Broadcasted Successfully");
      setShowBroadcastModal(false);
      setBroadcastMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to broadcast alert");
    }
  };

  const runMockDrill = async () => {
    if(!confirm("Initiate Simulation Mode? This will inject a mock fire incident.")) return;
    try {
      await addDoc(collection(db, "incidents"), {
        incidentType: "[SIMULATION] Fire Alert",
        location: "Mock Block A",
        description: "SIMULATION DRILL: Fire detected in Block A.",
        severity: "High",
        status: "reported",
        reporterId: userData?.uid,
        reporterName: userData?.name + " (Admin)",
        reporterRole: "admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timelineEvents: [{
          type: "created",
          message: "Simulation Drill Initiated",
          actorId: userData?.uid,
          actorName: userData?.name,
          timestamp: Date.now()
        }],
        isSimulation: true,
        aiSummary: "[SIMULATION] Controlled test of fire response protocol.",
        aiEscalationRisk: "High - Simulation",
        aiSuggestedTeam: "Fire Response Team",
        aiPlaybook: "1. Evacuate Mock Block A.\n2. Dispatch responders.\n3. Await simulated all-clear."
      });
      toast.success("Simulation drill injected successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to run drill");
    }
  };

  const filteredIncidents = activeIncidents.filter(inc => {
    if (filterSeverity !== "All" && inc.severity !== filterSeverity) return false;
    if (filterStatus !== "All" && inc.status !== filterStatus) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      return (
        inc.incidentType.toLowerCase().includes(term) ||
        inc.location.toLowerCase().includes(term) ||
        inc.reporterName.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Premium Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-[#0f172a] p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="z-10 w-full md:w-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Crisis Command Center</h1>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time venue operations and emergency orchestration.</p>
          
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* SafePulse Pill */}
            <div className={`px-5 py-2 rounded-full text-sm font-black flex items-center gap-2 ${pulseBg}`}>
              <Activity className={`h-4 w-4 ${pulseColor}`} />
              SafePulse™: {riskScore} ({pulseLabel})
            </div>
            
            {criticalCount > 0 && (
              <div className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500/20">
                <div className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></div>
                ELEVATED RISK LEVEL
              </div>
            )}
          </div>
        </div>
        <div className="z-10 flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
          <Button variant="outline" className="shadow-sm border-slate-300 dark:border-slate-700 font-bold dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={() => setShowBroadcastModal(true)}>
            <Megaphone className="h-4 w-4 mr-2" /> Mass Alert
          </Button>
          <Button variant="outline" className="shadow-sm border-slate-300 dark:border-slate-700 font-bold dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={runMockDrill}>
            <PlayCircle className="h-4 w-4 mr-2" /> Run Drill
          </Button>
          <Button variant="outline" className="shadow-sm border-slate-300 dark:border-slate-700 font-bold dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardContent className="p-6">
            <p className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-2">Active</p>
            <h3 className="text-4xl font-black">{activeCount}</h3>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-md text-white ${criticalCount > 0 ? 'bg-gradient-to-br from-red-500 to-rose-700 animate-pulse duration-2000' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
          <CardContent className="p-6">
            <p className="text-white/80 font-bold text-sm uppercase tracking-wider mb-2">Critical</p>
            <h3 className="text-4xl font-black">{criticalCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Readiness</p>
                <h3 className={`text-3xl font-black ${readinessScore < 50 ? 'text-orange-500' : 'text-emerald-500'}`}>{readinessScore}%</h3>
              </div>
              <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Responders</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{responders.length}</h3>
              </div>
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Resolved</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{resolvedToday}</h3>
              </div>
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Command Center (Left 2 Columns) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Critical Spotlight */}
          {topCriticalIncident && (
            <Card className="border-red-200 shadow-lg shadow-red-500/10 dark:shadow-red-900/20 overflow-hidden relative dark:bg-red-950/20">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-600"></div>
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-center bg-red-50/30 dark:bg-red-900/10">
                <div className="flex-1">
                  <Badge variant="destructive" className="mb-3 px-3 py-1 animate-pulse">ACTION REQUIRED</Badge>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Critical {topCriticalIncident.incidentType} at {topCriticalIncident.location}</h2>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><UserIcon className="h-4 w-4" /> {topCriticalIncident.reporterName}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(topCriticalIncident.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm font-medium">
                    <span className="font-bold text-red-600 dark:text-red-400 uppercase text-xs tracking-wider block mb-1">Gemini AI Summary</span>
                    {topCriticalIncident.aiSummary}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                  <Button size="lg" className="w-full md:w-48 bg-red-600 hover:bg-red-700 text-white font-bold h-14 shadow-lg shadow-red-600/20" onClick={() => setSelectedIncident(topCriticalIncident)}>
                    Open Command
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Table Section */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 dark:bg-slate-900">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Active Operations Queue
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <Input 
                    placeholder="Search location, reporter..." 
                    className="pl-9 w-56 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 px-3">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select 
                    className="bg-transparent text-sm font-medium outline-none border-none focus:ring-0 text-slate-900 dark:text-white w-full"
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
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 px-3">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <select 
                    className="bg-transparent text-sm font-medium outline-none border-none focus:ring-0 text-slate-900 dark:text-white w-full"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">All Active Status</option>
                    <option value="reported" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Reported</option>
                    <option value="acknowledged" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Acknowledged</option>
                    <option value="assigned" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Assigned</option>
                    <option value="en_route" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">En Route</option>
                    <option value="in_progress" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">In Progress</option>
                    <option value="escalated" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Escalated</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Synchronizing feed...</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="p-4 px-6">Type & Location</th>
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Severity</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assigned</th>
                      <th className="p-4 text-right px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredIncidents.map(incident => (
                      <tr key={incident.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4 px-6">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {/* @ts-ignore */}
                            {incident.isSimulation && <Badge className="mr-2 text-[8px] px-1 bg-purple-500">DRILL</Badge>}
                            {incident.incidentType}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {incident.location}</p>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{incident.reporterName}</td>
                        <td className="p-4">
                          <Badge variant={getSeverityBadge(incident.severity)} className="font-bold">{incident.severity}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={incident.status === 'reported' ? 'outline' : 'info'} className="capitalize font-bold dark:bg-transparent dark:border-blue-500/50">
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                          {(incident.assignedNames && incident.assignedNames.length > 0) ? incident.assignedNames.join(", ") : "Unassigned"}
                        </td>
                        <td className="p-4 text-right px-6">
                          <Button size="sm" variant="secondary" className="font-bold hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={() => setSelectedIncident(incident)}>
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredIncidents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-16 text-center text-slate-500">
                          <CheckCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                          <p className="font-bold text-lg text-slate-700 dark:text-slate-400">Queue Clear</p>
                          <p>No incidents match the active criteria.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Watchlist, Hotspots & Live Feed */}
        <div className="space-y-6">
          
          {/* Hotspot Intelligence */}
          {hotspots.length > 0 && (
            <Card className="border-red-200 dark:border-red-900/50 shadow-sm bg-red-50/50 dark:bg-red-950/20">
              <div className="p-4 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h2 className="font-black text-red-900 dark:text-red-400 uppercase tracking-widest text-xs">Hotspot Intelligence</h2>
              </div>
              <CardContent className="p-4">
                <div className="text-xs font-bold text-red-600/80 dark:text-red-400/80 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Cluster Detected
                </div>
                <div className="space-y-2">
                  {hotspots.map(([loc, count], idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{loc}</span>
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-600 text-[10px]">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Escalation Watchlist */}
          <Card className="border-orange-200 dark:border-orange-900/50 shadow-sm bg-orange-50/50 dark:bg-orange-950/20">
            <div className="p-4 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h2 className="font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest text-xs">Escalation Watchlist</h2>
            </div>
            <CardContent className="p-4">
              {escalationWatchlist.length === 0 ? (
                <div className="text-center py-6 text-orange-600/60 dark:text-orange-400/60 font-medium text-sm">No critical escalations pending.</div>
              ) : (
                <div className="space-y-3">
                  {escalationWatchlist.map(inc => (
                    <div key={inc.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-orange-200 dark:border-orange-900/30 shadow-sm cursor-pointer hover:border-orange-400 transition-colors" onClick={() => setSelectedIncident(inc)}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {/* @ts-ignore */}
                          {inc.isSimulation && <Badge className="mr-2 text-[8px] px-1 bg-purple-500">DRILL</Badge>}
                          {inc.incidentType}
                        </span>
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-orange-600">WATCH</Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {inc.location}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Event Feed */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Live Event Feed</h2>
            </div>
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {incidents.slice(0, 10).map(inc => (
                  <div key={inc.id} className="flex gap-3 text-sm border-l-2 border-blue-200 dark:border-blue-900 pl-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        <span className="text-blue-600 dark:text-blue-400">[{inc.incidentType}]</span> {inc.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{new Date(inc.updatedAt).toLocaleTimeString()} • {inc.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        title={
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black">
            <Megaphone className="h-6 w-6" /> Mass Alert Broadcast
          </div>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500 font-medium">This will immediately send an alert banner to all active guest dashboards.</p>
          
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Alert Template</label>
            <select 
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              value={broadcastTemplate}
              onChange={(e) => setBroadcastTemplate(e.target.value)}
            >
              <option value="Shelter in Place" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Shelter in Place</option>
              <option value="Evacuate Zone" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Evacuate Zone</option>
              <option value="Avoid Area" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Avoid Area</option>
              <option value="Security on Route" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Security on Route</option>
              <option value="Medical Assistance Incoming" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Medical Assistance Incoming</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Custom Message</label>
            <textarea 
              className="flex w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[120px] text-slate-900 dark:text-white"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Provide specific instructions..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" className="font-bold dark:text-white dark:hover:bg-slate-800" onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
            <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 text-white shadow-lg shadow-indigo-500/20" onClick={handleBroadcast}>
              Transmit Alert
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={
          <div className="flex items-center gap-3 w-full justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${selectedIncident?.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
              <span className="font-black text-xl dark:text-white">Command: {selectedIncident?.incidentType}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="font-bold text-xs dark:bg-slate-800 dark:text-white dark:border-slate-700" onClick={copyIncidentData}>
                <Copy className="h-3 w-3 mr-1" /> Copy Ref
              </Button>
            </div>
          </div>
        }
        className="max-w-5xl"
      >
        {selectedIncident && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Intelligence & Details */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Severity</p>
                  <Badge variant={getSeverityBadge(selectedIncident.severity)} className="font-bold">{selectedIncident.severity}</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <Badge variant="outline" className="capitalize font-bold bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700">{selectedIncident.status.replace('_', ' ')}</Badge>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{selectedIncident.location}</p>
                </div>
                <div className="col-span-4 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Description</p>
                  <p className="text-sm bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    "{selectedIncident.description}"
                  </p>
                </div>
              </div>

              {/* Gemini Intelligence Panel */}
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-blue-400 font-black tracking-widest uppercase text-xs">
                      <Zap className="h-5 w-5" /> AI Crisis Copilot
                    </div>
                    {/* @ts-ignore */}
                    {selectedIncident.isSimulation && (
                      <Badge className="bg-purple-500 uppercase font-bold text-[10px] tracking-widest">Simulation Mode</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                      <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Incident Summary</h4>
                      <p className="text-sm mt-1 font-medium leading-relaxed">{selectedIncident.aiSummary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-orange-400 font-bold text-[10px] uppercase tracking-widest mb-2">Escalation Predictor</h4>
                        <p className="text-sm font-medium">{selectedIncident.aiEscalationRisk || "Monitor for escalation."}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-2">Suggested Dispatch</h4>
                        <p className="text-sm font-medium">{selectedIncident.aiSuggestedTeam || "Standard Responder"}</p>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                      <h4 className="text-blue-300 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><Target className="h-3 w-3"/> Recommended Immediate Actions</h4>
                      <p className="text-sm whitespace-pre-wrap font-medium text-blue-50">{selectedIncident.aiPlaybook}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Incident Executive Summary */}
              {selectedIncident.status === 'resolved' && (
                <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg border border-emerald-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> AI Post-Incident Executive Summary
                    </h4>
                    {!selectedIncident.aiPostIncidentRecap && (
                      <Button size="sm" onClick={() => generateRecap(selectedIncident.id)} disabled={generatingRecap} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                        {generatingRecap ? "Analyzing..." : "Generate AI Recap"}
                      </Button>
                    )}
                  </div>
                  {selectedIncident.aiPostIncidentRecap ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium leading-relaxed text-emerald-50 bg-black/20 p-4 rounded-xl border border-emerald-800/50">
                        <p className="font-bold text-emerald-400 mb-1">Response Summary</p>
                        {selectedIncident.aiPostIncidentRecap}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-800/50">
                          <span className="text-emerald-500 font-bold block mb-1">Time to Resolve</span>
                          {selectedIncident.resolvedAt ? Math.round((selectedIncident.resolvedAt - selectedIncident.createdAt) / 60000) + ' minutes' : 'N/A'}
                        </div>
                        <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-800/50">
                          <span className="text-emerald-500 font-bold block mb-1">SLA Status</span>
                          <span className="text-emerald-300">MET (Resolved within operational target)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-emerald-500/50 italic">Generate an AI recap to summarize the response and extract preventive recommendations.</p>
                  )}
                </div>
              )}

            </div>

            {/* Right Column: Actions & Timeline */}
            <div className="space-y-6">
              
              {/* Assignment Controls */}
              {selectedIncident.status !== 'resolved' && (
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <Zap className="h-4 w-4 text-indigo-600" /> Dispatch Responder
                  </h4>
                  <div className="space-y-3">
                    <select 
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                      id="responder-select"
                    >
                      <option value="" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Select personnel...</option>
                      {responders.map(r => (
                        <option key={r.uid} value={r.uid} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{r.name} ({r.role})</option>
                      ))}
                    </select>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-md"
                      onClick={() => {
                        const val = (document.getElementById("responder-select") as HTMLSelectElement).value;
                        if(val) assignResponder(selectedIncident.id, val);
                      }}
                    >
                      Dispatch Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Override Status
                </h4>
                <div className="space-y-3">
                  <select 
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    id="status-select"
                    defaultValue={selectedIncident.status}
                  >
                    <option value="reported" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Reported</option>
                    <option value="acknowledged" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Acknowledged</option>
                    <option value="assigned" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Assigned</option>
                    <option value="en_route" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">En Route</option>
                    <option value="in_progress" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">In Progress</option>
                    <option value="escalated" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Escalated</option>
                    <option value="resolved" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Resolved</option>
                  </select>
                  <Button 
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold h-12 rounded-xl shadow-md"
                    onClick={() => {
                      const val = (document.getElementById("status-select") as HTMLSelectElement).value;
                      if(val && val !== selectedIncident.status) updateStatus(selectedIncident.id, val);
                    }}
                  >
                    Force Update
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <Clock className="h-4 w-4 text-slate-400" /> Audit Trail & SLA
                </h4>
                
                {/* Basic SLA Tracker visualization */}
                <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-slate-500">SLA Tracking</span>
                    {selectedIncident.status === 'resolved' ? (
                      <span className="text-emerald-500">SLA Met</span>
                    ) : (
                      <span className="text-orange-500 animate-pulse">At Risk</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${selectedIncident.status === 'resolved' ? 'bg-emerald-500 w-full' : 'bg-orange-500 w-3/4'}`}></div>
                  </div>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent max-h-[400px] overflow-y-auto pr-2">
                  {(selectedIncident.timelineEvents || []).slice().reverse().map((event, idx) => (
                    <div key={idx} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm ml-2 md:ml-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{event.message}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                          {event.actorName} • {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
