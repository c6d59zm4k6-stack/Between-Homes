import { nanoid } from "nanoid";
import { db } from "./db";
import { getCurrentUid } from "./firebase";
import { pushJourney, pushMilestone, findJourneyByCode, joinJourney, subscribeToJourney } from "./sync";
import { MILESTONE_SETS, nextPrompt } from "./milestones";
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
  const journey: Journey = {
    id: nanoid(),
    joinCode: generateJoinCode(),
    createdAt: new Date().toISOString(),
    createdBy: uid,
    members: [uid],
    ...input,
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
