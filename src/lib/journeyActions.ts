import { nanoid } from "nanoid";
import { db } from "./db";
import { getCurrentUid } from "./firebase";
import { pushJourney, pushMilestone, findJourneyByCode, joinJourney, subscribeToJourney } from "./sync";
import { MILESTONE_SETS, nextPrompt } from "./milestones";
import { geocodeCity } from "./geocode";
import type { Journey, MilestoneInstance, JourneyType, FamilyMember } from "../types";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export interface CreateJourneyInput {
  type: JourneyType;
  title: string;
  departureCity?: string;
  destinationCity?: string;
  departureDate: string;
  familyMembers: FamilyMember[];
  flightDetails?: Journey["flightDetails"];
}

export async function createJourney(input: CreateJourneyInput): Promise<Journey> {
  const uid = getCurrentUid();
  // Best-effort geocoding — powers the "you're near the airport, want to
  // jump there?" nudge later. If it fails (offline, city name too vague),
  // the journey still gets created normally, just without that nudge.
  const [departureCoords, destinationCoords] = await Promise.all([
    input.departureCity ? geocodeCity(input.departureCity) : Promise.resolve(null),
    input.destinationCity ? geocodeCity(input.destinationCity) : Promise.resolve(null),
  ]);
  const journey: Journey = {
    id: nanoid(),
    joinCode: generateJoinCode(),
    createdAt: new Date().toISOString(),
    createdBy: uid,
    members: [uid],
    ...input,
    ...(departureCoords ? { departureCoords } : {}),
    ...(destinationCoords ? { destinationCoords } : {}),
  };
  await db.journeys.add(journey);

  const definitions = MILESTONE_SETS[input.type] ?? MILESTONE_SETS.relocation;
  const instances: MilestoneInstance[] = definitions.map((def, i) => ({
    id: nanoid(),
    journeyId: journey.id,
    key: def.key,
    order: i,
    status: i === 0 ? "active" : "locked",
    unlockedAt: i === 0 ? new Date().toISOString() : undefined,
    assignedPrompt: nextPrompt(),
  }));
  await db.milestones.bulkAdd(instances);

  void pushJourney(journey);
  instances.forEach((m) => void pushMilestone(m));
  subscribeToJourney(journey.id);

  return journey;
}

export async function markMilestoneCaptured(milestoneId: string) {
  const instance = await db.milestones.get(milestoneId);
  if (!instance) return;

  await db.milestones.update(milestoneId, {
    status: "captured",
    capturedAt: new Date().toISOString(),
  });
  const updated = await db.milestones.get(milestoneId);
  if (updated) void pushMilestone(updated);

  // unlock the next milestone in order, if any
  const siblings = await db.milestones
    .where("journeyId")
    .equals(instance.journeyId)
    .toArray();
  const next = siblings.find((m) => m.order === instance.order + 1);
  if (next && next.status === "locked") {
    await db.milestones.update(next.id, {
      status: "active",
      unlockedAt: new Date().toISOString(),
    });
    const updatedNext = await db.milestones.get(next.id);
    if (updatedNext) void pushMilestone(updatedNext);
  }
}

export async function skipMilestone(milestoneId: string) {
  const instance = await db.milestones.get(milestoneId);
  if (!instance) return;
  await db.milestones.update(milestoneId, { status: "skipped" });
  const updated = await db.milestones.get(milestoneId);
  if (updated) void pushMilestone(updated);

  const siblings = await db.milestones.where("journeyId").equals(instance.journeyId).toArray();
  const next = siblings.find((m) => m.order === instance.order + 1);
  if (next && next.status === "locked") {
    await db.milestones.update(next.id, { status: "active", unlockedAt: new Date().toISOString() });
    const updatedNext = await db.milestones.get(next.id);
    if (updatedNext) void pushMilestone(updatedNext);
  }
}

export async function joinJourneyByCode(code: string): Promise<Journey | null> {
  const journey = await findJourneyByCode(code.trim());
  if (!journey) return null;
  await db.journeys.put(journey);
  await joinJourney(journey.id);
  subscribeToJourney(journey.id);
  return journey;
}

/** Records which family member this device belongs to, shared via the
 * journey doc so every device can label content by name. */
export async function setMemberIdentity(journeyId: string, memberName: string) {
  const uid = getCurrentUid();
  const journey = await db.journeys.get(journeyId);
  if (!journey) return;
  const memberProfiles = { ...(journey.memberProfiles ?? {}), [uid]: memberName };
  await db.journeys.update(journeyId, { memberProfiles });
  const updated = await db.journeys.get(journeyId);
  if (updated) void pushJourney(updated);
}

/** Removes a journey and all its data from THIS device only. The cloud
 * copy and everyone else's devices are untouched — rejoining with the
 * code brings it back. Safe for cleaning up test journeys. */
export async function removeJourneyFromDevice(journeyId: string) {
  await Promise.all([
    db.milestones.where("journeyId").equals(journeyId).delete(),
    db.photos.where("journeyId").equals(journeyId).delete(),
    db.promptAnswers.where("journeyId").equals(journeyId).delete(),
    db.voiceNotes.where("journeyId").equals(journeyId).delete(),
    db.chapters.where("journeyId").equals(journeyId).delete(),
  ]);
  await db.journeys.delete(journeyId);
}
