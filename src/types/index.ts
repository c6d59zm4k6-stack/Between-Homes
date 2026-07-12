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
  // Geocoded once at creation (see lib/geocode.ts) so the app can compare
  // a phone's current location against these without any paid API.
  departureCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  lastReminderAt?: string; // set by the reminder-check endpoint, cooldown guard
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
  // Which family member each device belongs to — lets notes/photos be
  // labeled "Priya" instead of "the other phone" across any number of devices.
  memberProfiles?: Record<string, string>;
}

export type MilestoneStatus = "locked" | "active" | "captured" | "skipped";

export interface MilestoneDefinition {
  key: string; // stable key, e.g. "leaving_home"
  label: string;
  tagline?: string; // one warm line under the title, e.g. "One last look around."
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
  // Full-resolution base64 on the authoring device; a compressed copy
  // syncs to Firestore directly (no Firebase Storage / no paid plan
  // needed) so other devices see a smaller version of the same field.
  dataUrl?: string;
  // Small (~320px) thumbnail generated at capture time — grids render this
  // instead of decoding dozens of full-size images (memory safety on phones).
  thumbUrl?: string;
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
  // Recorded at a low bitrate so it fits directly in a Firestore doc.
  audioDataUrl?: string;
  // Actual recorded container (audio/mp4 on iPhone, audio/webm elsewhere).
  mimeType?: string;
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

export interface PushSubscriptionRecord {
  id: string; // = uid, one subscription per device
  journeyId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}
