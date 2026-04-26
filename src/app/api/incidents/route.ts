import { NextResponse } from "next/server";
import { analyzeIncident } from "@/lib/gemini";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reporterName, incidentType, location, description } = body;

    if (!reporterId || !incidentType || !location || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reporterSnap = await getDoc(doc(db, "users", reporterId));
    const reporter = reporterSnap.exists() ? reporterSnap.data() : null;
    const verifiedRole = reporter?.role || "guest";
    const verifiedName = reporter?.name || reporter?.displayName || reporterName || "Anonymous";

    // Call Gemini
    const aiAnalysis = await analyzeIncident({
      incidentType,
      description,
      location,
      reporterRole: verifiedRole
    });

    const incidentId = uuidv4();
    const now = Date.now();

    const newIncident = {
      id: incidentId,
      reporterId,
      reporterName: verifiedName,
      reporterRole: verifiedRole,
      incidentType,
      location,
      description,
      severity: aiAnalysis.severity,
      aiSummary: aiAnalysis.summary,
      aiPlaybook: aiAnalysis.playbook,
      aiSafetyGuidance: aiAnalysis.safetyGuidance,
      aiImmediateActions: aiAnalysis.immediateActions,
      aiEscalationRisk: aiAnalysis.escalationRisk,
      aiSuggestedTeam: aiAnalysis.suggestedTeam,
      aiUrgencyLabel: aiAnalysis.urgencyLabel,
      aiConfidence: aiAnalysis.confidence,
      aiPreventiveRecommendations: aiAnalysis.preventiveRecommendations,
      status: "reported",
      assignedTo: [],
      createdAt: now,
      updatedAt: now,
      timelineEvents: [
        {
          type: "status_change",
          message: "Incident reported",
          actorId: reporterId,
          actorName: verifiedName,
          timestamp: now
        }
      ]
    };

    const docRef = doc(db, "incidents", incidentId);
    await setDoc(docRef, newIncident);

    return NextResponse.json({ success: true, incident: newIncident });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
