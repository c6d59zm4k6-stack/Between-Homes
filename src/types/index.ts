// Core domain types for Between Homes

export type JourneyType =
  | "relocation"
  | "vacation"
  | "roadtrip"
  | "newborn"
  | "custom";

export interface FamilyMember {
  id: string;
  name: string;
  role: "parent" | "child" | "other";
  age?: number;
}

export interface Journey {
  id: string;
  joinCode: string; // short shareable code, e.g. "MOVE-7F2K"
  type: JourneyType;
  title: string; // e.g. "Bangalore to Seattle"
  departureCity?: string;
  destinationCity?: string;
  departureDate: string; // ISO date
  familyMembers: FamilyMember[];
  flightDetails?: {
    airline?: string;
    flightNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
  };
  createdAt: string;
  createdBy: string; // device/user uid
  members: string[]; // uids of everyone who has joined
}

export type MilestoneStatus = "locked" | "active" | "captured" | "skipped";

export interface MilestoneDefinition {
  key: string; // stable key, e.g. "leaving_home"
  label: string;
  phase: "before" | "airport" | "flight" | "arrival";
  photoSuggestions: string[];
  prompts: string[]; // pool of possible quick-prompts; one is chosen per instance
  estimatedSeconds: number;
}

export interface MilestoneInstance {
  id: string;
  journeyId: string;
  key: string; // references MilestoneDefinition.key
  order: number;
  status: MilestoneStatus;
  unlockedAt?: string;
  capturedAt?: string;
  assignedPrompt: string; // the single prompt shown for this instance
}

export interface Photo {
  id: string;
  journeyId: string;
  milestoneInstanceId: string;
  // Full-resolution base64 lives ONLY in IndexedDB on the authoring device.
  // Firestore documents carry storageUrl instead (1 MiB doc limit).
  dataUrl?: string;
  storageUrl?: string;
  caption?: string;
  timestamp: string;
  createdBy: string;
}

export interface PromptAnswer {
  id: string;
  journeyId: string;
  milestoneInstanceId: string;
  prompt: string;
  answer: string; // max 200 chars
  timestamp: string;
  createdBy: string;
}

export interface VoiceNote {
  id: string;
  journeyId: string;
  milestoneInstanceId: string;
  // base64 audio stays local; Firestore carries storageUrl only.
  audioDataUrl?: string;
  storageUrl?: string;
  durationSeconds: number;
  transcript?: string;
  timestamp: string;
  createdBy: string;
}

export interface Chapter {
  id: string;
  journeyId: string;
  milestoneInstanceIds: string[]; // milestones this chapter covers
  phase: string; // which timeline phase this chapter covers (dedupe key)
  title: string;
  body: string; // 600-900 word story
  generatedAt: string;
  photoIds: string[]; // photos referenced/available to the chapter
}

export interface SyncQueueItem {
  id: string;
  collection: "photos" | "promptAnswers" | "voiceNotes" | "milestones" | "journeys" | "chapters";
  docId: string;
  op: "put" | "delete";
  attempts: number;
  createdAt: string;
}
