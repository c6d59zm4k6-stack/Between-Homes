import { db } from "./db";
import { getMilestoneDefinition } from "./milestones";
import type { ChapterInput, ChapterInputMilestone } from "./ai";
import type { MilestoneInstance } from "../types";

export const PHASE_ORDER = ["before", "airport", "flight", "arrival"] as const;
export const PHASE_TITLE: Record<string, string> = {
  before: "Before Leaving",
  airport: "At the Airport",
  flight: "In the Air",
  arrival: "Arrival",
};

export function groupByPhase(
  instances: MilestoneInstance[],
  journeyType: string
): Record<string, MilestoneInstance[]> {
  const map: Record<string, MilestoneInstance[]> = {};
  for (const inst of instances) {
    const def = getMilestoneDefinition(journeyType, inst.key);
    const phase = def?.phase ?? "before";
    (map[phase] ??= []).push(inst);
  }
  return map;
}

export function isPhaseComplete(instances: MilestoneInstance[]): boolean {
  return instances.every((i) => i.status === "captured" || i.status === "skipped");
}

export async function assembleChapterInput(
  journeyTitle: string,
  journeyType: string,
  phase: string,
  instances: MilestoneInstance[]
): Promise<ChapterInput> {
  const milestones: ChapterInputMilestone[] = [];
  for (const inst of instances) {
    if (inst.status === "skipped") continue;
    const def = getMilestoneDefinition(journeyType, inst.key);
    const [photos, promptAnswers, voiceNotes] = await Promise.all([
      db.photos.where("milestoneInstanceId").equals(inst.id).toArray(),
      db.promptAnswers.where("milestoneInstanceId").equals(inst.id).toArray(),
      db.voiceNotes.where("milestoneInstanceId").equals(inst.id).toArray(),
    ]);
    const answered = promptAnswers.filter((a) => a.answer.trim());
    const transcripts = voiceNotes.map((v) => v.transcript).filter(Boolean);
    milestones.push({
      label: def?.label ?? inst.key,
      photos: photos.map((p) => ({ caption: p.caption, timestamp: p.timestamp })),
      promptQuestion: answered[0]?.prompt,
      // Both parents may have answered — give the writer every voice.
      promptAnswer: answered.map((a) => a.answer).join(" / ") || undefined,
      voiceTranscript: transcripts.join(" / ") || undefined,
    });
  }
  return {
    journeyTitle,
    dateLabel: PHASE_TITLE[phase] ?? phase,
    milestones,
  };
}
