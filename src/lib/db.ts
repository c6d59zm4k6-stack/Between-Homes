import Dexie, { type Table } from "dexie";
import type {
  Journey,
  MilestoneInstance,
  Photo,
  PromptAnswer,
  VoiceNote,
  Chapter,
  SyncQueueItem,
} from "../types";

class MemoryDirectorDB extends Dexie {
  journeys!: Table<Journey, string>;
  milestones!: Table<MilestoneInstance, string>;
  photos!: Table<Photo, string>;
  promptAnswers!: Table<PromptAnswer, string>;
  voiceNotes!: Table<VoiceNote, string>;
  chapters!: Table<Chapter, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("memory-director");
    this.version(1).stores({
      journeys: "id, joinCode",
      milestones: "id, journeyId, key, order, status",
      photos: "id, journeyId, milestoneInstanceId, timestamp",
      promptAnswers: "id, journeyId, milestoneInstanceId, timestamp",
      voiceNotes: "id, journeyId, milestoneInstanceId, timestamp",
      chapters: "id, journeyId, generatedAt",
      syncQueue: "id, collection, createdAt",
    });
  }
}

export const db = new MemoryDirectorDB();
