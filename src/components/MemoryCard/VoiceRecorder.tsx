import { useRef, useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { db } from "../../lib/db";
import { pushVoiceNote } from "../../lib/sync";
import { getCurrentUid } from "../../lib/firebase";

const MAX_SECONDS = 20;

interface Props {
  journeyId: string;
  milestoneInstanceId: string;
}

export function VoiceRecorder({ journeyId, milestoneInstanceId }: Props) {
  const existing = useLiveQuery(
    () => db.voiceNotes.where("milestoneInstanceId").equals(milestoneInstanceId).first(),
    [milestoneInstanceId]
  );

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0); // onstop fires from a stale render; read duration from a ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => stopTimer(), []);

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
      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 24_000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        const record = {
          id: nanoid(),
          journeyId,
          milestoneInstanceId,
          audioDataUrl: dataUrl,
          durationSeconds: elapsedRef.current,
          timestamp: new Date().toISOString(),
          createdBy: getCurrentUid(),
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

  async function deleteNote() {
    if (existing) await db.voiceNotes.delete(existing.id);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  if (existing) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3.5 py-3">
        <audio
          ref={audioRef}
          src={existing.audioDataUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-teal text-paper flex items-center justify-center shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <span className="text-sm text-ink-soft flex-1">
          Voice note · {existing.durationSeconds}s
        </span>
        <button onClick={deleteNote} className="text-stamp">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3.5 py-3 w-full"
    >
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        {recording && (
          <motion.span
            className="absolute inset-0 rounded-full bg-clay/30"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            recording ? "bg-clay" : "bg-ink"
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
        {recording ? `Recording… ${MAX_SECONDS - elapsed}s left` : "Add a 20-second voice note"}
      </span>
    </button>
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
