export type Role = 'guest' | 'staff' | 'responder' | 'admin';
export type IncidentStatus = 'reported' | 'acknowledged' | 'assigned' | 'en_route' | 'in_progress' | 'escalated' | 'resolved';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export interface IncidentTimelineEvent {
  type: string;
  message: string;
  actorId: string;
  actorName: string;
  timestamp: number;
}

export interface Incident {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: Role;
  incidentType: string;
  location: string;
  description: string;
  mediaUrl?: string;
  severity: IncidentSeverity;
  aiSummary: string;
  aiPlaybook: string;
  aiSafetyGuidance: string;
  aiEscalationRisk?: string;
  aiSuggestedTeam?: string;
  aiPostIncidentRecap?: string;
  status: IncidentStatus;
  assignedTo?: string[]; // Array of responder UIDs
  assignedNames?: string[]; // Array of responder names
  eta?: string;
  createdAt: number;
  updatedAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  timelineEvents: IncidentTimelineEvent[];
}
