import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeIncident(incidentDetails: {
  incidentType: string;
  description: string;
  location: string;
  reporterRole: string;
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a rapid response AI assistant.
Analyze the following emergency incident report and return a JSON response exactly matching the structure requested. Do not include markdown formatting or backticks around the JSON.

Incident Details:
- Type: ${incidentDetails.incidentType}
- Description: ${incidentDetails.description}
- Location: ${incidentDetails.location}
- Reporter Role: ${incidentDetails.reporterRole}

    Respond with a raw JSON object containing these keys:
- "severity": Must be exactly one of: "Low", "Medium", "High", "Critical".
- "summary": A concise 1-2 sentence summary of what is happening.
- "playbook": 3-4 bullet points of immediate recommended actions for responders.
- "safetyGuidance": Short safety instructions for the reporter.
- "escalationRisk": A 1-sentence risk assessment if the situation worsens.
- "suggestedTeam": The ideal role or team to handle this (e.g. "Security", "Medical", "Maintenance").
`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    
    // Strip markdown formatting if the model accidentally includes it
    let cleanText = text;
    if (cleanText.startsWith('\`\`\`json')) {
      cleanText = cleanText.substring(7);
      cleanText = cleanText.substring(0, cleanText.length - 3);
    } else if (cleanText.startsWith('\`\`\`')) {
      cleanText = cleanText.substring(3);
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const parsed = JSON.parse(cleanText.trim());
    return {
      severity: parsed.severity || "Medium",
      summary: parsed.summary || "Unable to generate summary.",
      playbook: parsed.playbook || "Standard emergency response protocol.",
      safetyGuidance: parsed.safetyGuidance || "Stay safe and wait for instructions.",
      escalationRisk: parsed.escalationRisk || "Monitor closely.",
      suggestedTeam: parsed.suggestedTeam || "General Staff"
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback
    return {
      severity: "Medium",
      summary: "Incident reported: " + incidentDetails.incidentType,
      playbook: "1. Assess situation. 2. Dispatch available responder.",
      safetyGuidance: "Please remain calm and move to a safe area if needed.",
      escalationRisk: "Standard monitoring required.",
      suggestedTeam: "General Response Team"
    };
  }
}

export async function generatePostIncidentRecap(incident: {incidentType: string, description: string, severity: string}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a rapid response AI assistant generating a post-incident recap.
Review this resolved incident and return a raw JSON object with a single key "recap".
The recap should be a professional 2-3 sentence summary of the resolution, acknowledging the response time and suggesting one preventive action.

Incident:
Type: ${incident.incidentType}
Description: ${incident.description}
Severity: ${incident.severity}
`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    let cleanText = text;
    if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.substring(7, cleanText.length - 3);
    else if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.substring(3, cleanText.length - 3);
    const parsed = JSON.parse(cleanText.trim());
    return parsed.recap || "Incident was handled according to protocol.";
  } catch {
    return "Incident resolved successfully. Standard preventive measures advised.";
  }
}
