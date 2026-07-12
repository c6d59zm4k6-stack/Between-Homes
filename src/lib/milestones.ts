import type { MilestoneDefinition } from "../types";

// The single pool of "never emotional, never therapy" quick prompts.
// One is assigned per milestone instance, rotating so the same prompt
// doesn't repeat back-to-back.
export const PROMPT_POOL: string[] = [
  "What took the longest today?",
  "Who handled today's chaos best?",
  "What surprised you?",
  "Funniest moment?",
  "Which purchase saved the day?",
  "What will we probably laugh about later?",
  "What almost went wrong?",
  "What photo are you glad you took?",
  "One thing that already feels normal?",
  "One thing the kids noticed?",
];

// The relocation journey timeline — India to USA, but phase-generic
// enough to reuse for any international move.
export const RELOCATION_MILESTONES: MilestoneDefinition[] = [
  {
    key: "leaving_home",
    label: "Leaving Home",
    phase: "before",
    photoSuggestions: [
      "Family outside the front door",
      "Front door, right after locking it",
      "The empty living room",
      "Car packed with luggage",
    ],
    prompts: PROMPT_POOL,
    estimatedSeconds: 45,
  },
  {
    key: "drive_to_airport",
    label: "Drive to Airport",
    phase: "before",
    photoSuggestions: [
      "View out the car window",
      "Kids in the backseat",
      "Last look at the neighborhood",
    ],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "airport_arrival",
    label: "Airport Arrival",
    phase: "airport",
    photoSuggestions: [
      "Departure board",
      "Trolley loaded with bags",
      "Family selfie at the entrance",
    ],
    prompts: PROMPT_POOL,
    estimatedSeconds: 30,
  },
  {
    key: "checkin",
    label: "Check-in",
    phase: "airport",
    photoSuggestions: [
      "Boarding passes in hand",
      "Bags on the belt",
      "Check-in counter signage",
    ],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "security",
    label: "Security",
    phase: "airport",
    photoSuggestions: ["Shoes back on", "Kids' tray of small treasures"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 15,
  },
  {
    key: "waiting_at_gate",
    label: "Waiting at the Gate",
    phase: "airport",
    photoSuggestions: [
      "Child watching planes through the window",
      "Coffee while waiting",
      "Gate number and departure sign",
    ],
    prompts: PROMPT_POOL,
    estimatedSeconds: 45,
  },
  {
    key: "boarding",
    label: "Boarding",
    phase: "airport",
    photoSuggestions: ["Boarding gate", "Walking down the jet bridge"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "takeoff",
    label: "Takeoff",
    phase: "flight",
    photoSuggestions: ["Shoes under the seat in front", "Runway through the window"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 15,
  },
  {
    key: "meal",
    label: "Meal",
    phase: "flight",
    photoSuggestions: ["Meal tray", "Kids' reaction to airplane food"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 15,
  },
  {
    key: "mid_flight",
    label: "Mid-flight",
    phase: "flight",
    photoSuggestions: ["Sleeping child", "Screen showing the flight map", "The wing"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "sunset",
    label: "Sunset",
    phase: "flight",
    photoSuggestions: ["Window at sunset", "Cabin lit gold"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 15,
  },
  {
    key: "landing",
    label: "Landing",
    phase: "flight",
    photoSuggestions: ["First glimpse of the new city", "Wheels down"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 15,
  },
  {
    key: "immigration",
    label: "Immigration",
    phase: "arrival",
    photoSuggestions: ["Immigration hall signage", "Stamped passport"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "baggage",
    label: "Baggage",
    phase: "arrival",
    photoSuggestions: ["First trolley on new soil", "Bags coming around the carousel"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "first_drive",
    label: "First Drive",
    phase: "arrival",
    photoSuggestions: ["Welcome sign", "New streets out the car window"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "first_home",
    label: "First Home",
    phase: "arrival",
    photoSuggestions: ["Empty new home", "First family photo inside the door"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 30,
  },
  {
    key: "first_meal",
    label: "First Meal",
    phase: "arrival",
    photoSuggestions: ["First grocery store haul", "First meal in the new place"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
  {
    key: "first_night",
    label: "First Night",
    phase: "arrival",
    photoSuggestions: ["Beds made up for the first time", "Lights of the new city at night"],
    prompts: PROMPT_POOL,
    estimatedSeconds: 20,
  },
];

export const MILESTONE_SETS: Record<string, MilestoneDefinition[]> = {
  relocation: RELOCATION_MILESTONES,
  // Future journey types (vacation, roadtrip, newborn, ...) plug in here
  // following the same MilestoneDefinition shape.
};

export function getMilestoneDefinition(
  journeyType: string,
  key: string
): MilestoneDefinition | undefined {
  return (MILESTONE_SETS[journeyType] ?? RELOCATION_MILESTONES).find(
    (m) => m.key === key
  );
}

let promptCursor = 0;
export function nextPrompt(excludeLast?: string): string {
  // simple rotation with light shuffle so it doesn't feel mechanical
  const pool = PROMPT_POOL.filter((p) => p !== excludeLast);
  const choice = pool[promptCursor % pool.length];
  promptCursor += 1;
  return choice;
}
