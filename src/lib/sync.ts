import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { dbFs, isFirebaseConfigured, getCurrentUid } from "./firebase";
import { compressDataUrl } from "./imageCompress";
import { db } from "./db";
import type {
  Journey,
  MilestoneInstance,
  Photo,
  PromptAnswer,
  VoiceNote,
  Chapter,
} from "../types";

// ---- helpers -------------------------------------------------------------

function journeyCollections(journeyId: string) {
  if (!dbFs) throw new Error("Firestore not configured");
  const base = doc(dbFs, "journeys", journeyId);
  return {
    journeyDoc: base,
    milestones: collection(base, "milestones"),
    photos: collection(base, "photos"),
    promptAnswers: collection(base, "promptAnswers"),
    voiceNotes: collection(base, "voiceNotes"),
    chapters: collection(base, "chapters"),
    subscriptions: collection(base, "subscriptions"),
  };
}

export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

// ---- push (local -> cloud) ------------------------------------------------
// Every push is best-effort: if offline or unconfigured, it silently no-ops
// and the record simply stays local until the next sync attempt.

export async function pushJourney(journey: Journey) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const { journeyDoc } = journeyCollections(journey.id);
  await setDoc(journeyDoc, journey, { merge: true });
}

export async function pushMilestone(m: MilestoneInstance) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const { milestones } = journeyCollections(m.journeyId);
  await setDoc(doc(milestones, m.id), m, { merge: true });
}

export async function pushPromptAnswer(p: PromptAnswer) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const { promptAnswers } = journeyCollections(p.journeyId);
  await setDoc(doc(promptAnswers, p.id), p, { merge: true });
}

export async function pushPhoto(p: Photo) {
  if (!isFirebaseConfigured || !isOnline() || !p.dataUrl) return;
  // No Firebase Storage (that requires a paid Blaze plan) — instead we
  // shrink the photo enough to fit directly inside the Firestore document.
  // The originating device keeps the full-resolution copy locally.
  const compressed = await compressDataUrl(p.dataUrl);
  const { photos } = journeyCollections(p.journeyId);
  await setDoc(doc(photos, p.id), { ...p, dataUrl: compressed }, { merge: true });
}

export async function pushVoiceNote(v: VoiceNote) {
  if (!isFirebaseConfigured || !isOnline() || !v.audioDataUrl) return;
  // Recorded at a low bitrate (see VoiceRecorder.tsx) specifically so a
  // full 20-second note fits inside Firestore's 1 MiB document limit —
  // no Storage upload needed.
  if (v.audioDataUrl.length > 950_000) {
    console.warn("Voice note too large to sync; it will stay local-only on this device.");
    return;
  }
  const { voiceNotes } = journeyCollections(v.journeyId);
  await setDoc(doc(voiceNotes, v.id), v, { merge: true });
}

export async function pushChapter(c: Chapter) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const { chapters } = journeyCollections(c.journeyId);
  await setDoc(doc(chapters, c.id), c, { merge: true });
}

export async function deleteSubscription(journeyId: string, uid: string) {
  if (!isFirebaseConfigured || !dbFs) return;
  const { subscriptions } = journeyCollections(journeyId);
  await deleteDoc(doc(subscriptions, uid));
}

export async function saveSubscription(
  journeyId: string,
  uid: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  if (!isFirebaseConfigured || !dbFs) return;
  const { subscriptions } = journeyCollections(journeyId);
  await setDoc(
    doc(subscriptions, uid),
    {
      id: uid,
      journeyId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ---- join a shared journey by code ---------------------------------------

export async function findJourneyByCode(code: string): Promise<Journey | null> {
  if (!isFirebaseConfigured || !dbFs) return null;
  const q = query(collection(dbFs, "journeys"), where("joinCode", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Journey;
}

export async function joinJourney(journeyId: string) {
  if (!isFirebaseConfigured || !dbFs) return;
  const uid = getCurrentUid();
  const { journeyDoc } = journeyCollections(journeyId);
  await setDoc(journeyDoc, { members: arrayUnion(uid) }, { merge: true });
}

// ---- subscribe (cloud -> local) -------------------------------------------
// Merges remote docs into Dexie. Last-write-wins is fine here since each
// record (a photo, a prompt answer, a voice note) is authored by exactly
// one parent and never co-edited.

export function subscribeToJourney(journeyId: string): Unsubscribe[] {
  if (!isFirebaseConfigured || !dbFs) return [];
  const { journeyDoc, milestones, photos, promptAnswers, voiceNotes, chapters } =
    journeyCollections(journeyId);

  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(journeyDoc, (snap) => {
      if (snap.exists()) void db.journeys.put(snap.data() as Journey);
    })
  );
  unsubs.push(
    onSnapshot(milestones, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type !== "removed") void db.milestones.put(c.doc.data() as MilestoneInstance);
      });
    })
  );
  unsubs.push(
    onSnapshot(photos, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type === "removed") return;
        const remote = c.doc.data() as Photo;
        // Preserve this device's local full-res base64 if it has one —
        // the remote doc carries a smaller, compressed copy instead.
        void db.photos.get(remote.id).then((local) =>
          db.photos.put({ ...remote, dataUrl: local?.dataUrl ?? remote.dataUrl })
        );
      });
    })
  );
  unsubs.push(
    onSnapshot(promptAnswers, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type !== "removed") void db.promptAnswers.put(c.doc.data() as PromptAnswer);
      });
    })
  );
  unsubs.push(
    onSnapshot(voiceNotes, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type === "removed") return;
        const remote = c.doc.data() as VoiceNote;
        void db.voiceNotes.get(remote.id).then((local) =>
          db.voiceNotes.put({ ...remote, audioDataUrl: local?.audioDataUrl ?? remote.audioDataUrl })
        );
      });
    })
  );
  unsubs.push(
    onSnapshot(chapters, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type !== "removed") void db.chapters.put(c.doc.data() as Chapter);
      });
    })
  );

  return unsubs;
}

// ---- retry queue -----------------------------------------------------------
// Called on app start and whenever the browser comes back online, to flush
// anything created while offline.

export async function flushPendingSync(journeyId: string) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const [journey, milestones, photos, promptAnswers, voiceNotes, chapters] = await Promise.all([
    db.journeys.get(journeyId),
    db.milestones.where("journeyId").equals(journeyId).toArray(),
    db.photos.where("journeyId").equals(journeyId).toArray(),
    db.promptAnswers.where("journeyId").equals(journeyId).toArray(),
    db.voiceNotes.where("journeyId").equals(journeyId).toArray(),
    db.chapters.where("journeyId").equals(journeyId).toArray(),
  ]);
  if (journey) await pushJourney(journey);
  await Promise.all([
    ...milestones.map(pushMilestone),
    ...photos.map(pushPhoto),
    ...promptAnswers.map(pushPromptAnswer),
    ...voiceNotes.map(pushVoiceNote),
    ...chapters.map(pushChapter),
  ]);
}
