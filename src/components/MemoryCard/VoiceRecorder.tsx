import { useRef, useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { db } from "../../lib/db";
import { pushVoiceNote } from "../../lib/sync";
import { getCurrentUid } from "../../lib/firebase";
import { useMemberName } from "../../lib/useJourneyHelpers";
import type { VoiceNote } from "../../types";

// iPhones can only record audio/mp4; Chrome/Android record webm. Prefer
// mp4 when the device supports recording it, since mp4 PLAYS everywhere
// while webm does not play on iPhones. Never hardcode the label.
function pickMimeType(): string | undefined {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return undefined;
}

const MAX_SECONDS = 20;

interface Props {
  journeyId: string;
  milestoneInstanceId: string;
}

export function VoiceRecorder({ journeyId, milestoneInstanceId }: Props) {
  // Everyone's notes for this milestone — each family member records their
  // own; this device can only delete its own.
  const notes = useLiveQuery(
    () => db.voiceNotes.where("milestoneInstanceId").equals(milestoneInstanceId).toArray(),
    [milestoneInstanceId]
  );
  const uid = getCurrentUid();
  const mine = notes?.find((n) => n.createdBy === uid);
  const others = (notes ?? []).filter((n) => n.createdBy !== uid);
  const nameFor = useMemberName(journeyId);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0); // onstop fires from a stale render; read duration from a ref

  useEffect(
    () => () => {
      stopTimer();
      // If the person navigates away mid-recording, the mic stream was
      // never being released — iOS then keeps showing an active-microphone
      // indicator indefinitely, which can sit on top of and block other UI.
      // Detach handlers first so leaving doesn't save a half-finished note.
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.stream.getTracks().forEach((t) => t.stop());
      }
    },
    []
  );

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Deliberately low bitrate: with no Firebase Storage in the picture,
      // the recording has to fit directly inside a Firestore document.
      // ~24 kbps keeps a full 20s note comfortably under the 1 MiB limit
      // (speech stays intelligible at this rate — it's not music).
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 24_000,
        ...(mimeType ? { mimeType } : {}),
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        // Use the recorder's REAL container type — hardcoding audio/webm
        // mislabeled iPhone recordings (which are mp4) and broke playback.
        const actualType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        const dataUrl = await blobToDataUrl(blob);
        const record: VoiceNote = {
          id: nanoid(),
          journeyId,
          milestoneInstanceId,
          audioDataUrl: dataUrl,
          mimeType: actualType,
          durationSeconds: elapsedRef.current,
          timestamp: new Date().toISOString(),
          createdBy: uid,
        };
        await db.voiceNotes.add(record);
        void pushVoiceNote(record);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = Math.min(prev + 1, MAX_SECONDS);
          elapsedRef.current = next;
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      alert("Microphone access is needed for a voice note.");
    }
  }

  function stopRecording() {
    stopTimer();
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function deleteMine() {
    if (mine) await db.voiceNotes.delete(mine.id);
  }

  return (
    <div className="space-y-2">
      {others.map((note) => (
        <VoiceNoteRow
          key={note.id}
          note={note}
          label={
            nameFor(note.createdBy)
              ? `${nameFor(note.createdBy)} · ${note.durationSeconds}s`
              : `From another device · ${note.durationSeconds}s`
          }
        />
      ))}

      {mine ? (
        <VoiceNoteRow note={mine} label={`Your note · ${mine.durationSeconds}s`} onDelete={deleteMine} />
      ) : (
        <button
          onClick={recording ? stopRecording : startRecording}
          className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3.5 py-3 w-full"
        >
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            {recording && (
              <motion.span
                className="absolute inset-0 rounded-full bg-coral/30"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                recording ? "bg-coral" : "bg-ink"
              }`}
            >
              {recording ? (
                <Square className="w-3.5 h-3.5 text-paper" fill="currentColor" />
              ) : (
                <Mic className="w-4 h-4 text-paper" />
              )}
            </div>
          </div>
          <span className="text-sm text-ink-soft">
            {recording
              ? `Recording… ${MAX_SECONDS - elapsed}s left`
              : others.length > 0
                ? "Add your own 20-second voice note"
                : "Add a 20-second voice note"}
          </span>
        </button>
      )}
    </div>
  );
}

function VoiceNoteRow({
  note,
  label,
  onDelete,
}: {
  note: VoiceNote;
  label: string;
  onDelete?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3.5 py-3">
      <audio
        ref={audioRef}
        src={note.audioDataUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-teal text-paper flex items-center justify-center shrink-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <span className="text-sm text-ink-soft flex-1">{label}</span>
      {onDelete && (
        <button onClick={onDelete} className="text-stamp" aria-label="Delete note">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
