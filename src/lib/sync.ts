import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { dbFs, storage, isFirebaseConfigured, getCurrentUid } from "./firebase";
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
  if (!isFirebaseConfigured || !isOnline() || !storage) return;
  let storageUrl = p.storageUrl;
  if (!storageUrl && p.dataUrl?.startsWith("data:")) {
    const path = `journeys/${p.journeyId}/photos/${p.id}.jpg`;
    const fileRef = ref(storage, path);
    await uploadString(fileRef, p.dataUrl, "data_url");
    storageUrl = await getDownloadURL(fileRef);
  }
  if (!storageUrl) return; // nothing uploadable yet
  // Firestore docs have a 1 MiB limit — the base64 image must never be
  // written into the document. The doc carries only the Storage URL.
  const { dataUrl: _localOnly, ...docData } = p;
  const { photos } = journeyCollections(p.journeyId);
  await setDoc(doc(photos, p.id), { ...docData, storageUrl }, { merge: true });
  await db.photos.update(p.id, { storageUrl });
}

export async function pushVoiceNote(v: VoiceNote) {
  if (!isFirebaseConfigured || !isOnline() || !storage) return;
  let storageUrl = v.storageUrl;
  if (!storageUrl && v.audioDataUrl?.startsWith("data:")) {
    const path = `journeys/${v.journeyId}/voice/${v.id}.webm`;
    const fileRef = ref(storage, path);
    await uploadString(fileRef, v.audioDataUrl, "data_url");
    storageUrl = await getDownloadURL(fileRef);
  }
  if (!storageUrl) return;
  const { audioDataUrl: _localOnly, ...docData } = v;
  const { voiceNotes } = journeyCollections(v.journeyId);
  await setDoc(doc(voiceNotes, v.id), { ...docData, storageUrl }, { merge: true });
  await db.voiceNotes.update(v.id, { storageUrl });
}

export async function pushChapter(c: Chapter) {
  if (!isFirebaseConfigured || !isOnline()) return;
  const { chapters } = journeyCollections(c.journeyId);
  await setDoc(doc(chapters, c.id), c, { merge: true });
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
        // the remote doc intentionally carries only the storageUrl.
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
    ...photos.filter((p) => !p.storageUrl).map(pushPhoto),
    ...promptAnswers.map(pushPromptAnswer),
    ...voiceNotes.filter((v) => !v.storageUrl).map(pushVoiceNote),
    ...chapters.map(pushChapter),
  ]);
}
