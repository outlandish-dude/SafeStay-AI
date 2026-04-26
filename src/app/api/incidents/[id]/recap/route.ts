import { NextResponse } from "next/server";
import { generatePostIncidentRecap } from "@/lib/gemini";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const docRef = doc(db, "incidents", id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const incidentData = snapshot.data();
    
    if (incidentData.aiPostIncidentRecap) {
      return NextResponse.json({ recap: incidentData.aiPostIncidentRecap });
    }

    const recap = await generatePostIncidentRecap({
      incidentType: incidentData.incidentType || 'Unknown',
      description: incidentData.description || 'No description provided',
      severity: incidentData.severity || 'Unknown'
    });

    await updateDoc(docRef, { aiPostIncidentRecap: recap });

    return NextResponse.json({ recap });
  } catch (error) {
    console.error("Error generating recap:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
