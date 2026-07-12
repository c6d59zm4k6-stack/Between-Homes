import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../lib/db";
import { pushPromptAnswer } from "../../lib/sync";
import { getCurrentUid } from "../../lib/firebase";

const MAX_LEN = 200;
const PUSH_DEBOUNCE_MS = 900;

interface Props {
  journeyId: string;
  milestoneInstanceId: string;
  prompt: string;
}

export function PromptInput({ journeyId, milestoneInstanceId, prompt }: Props) {
  const existing = useLiveQuery(
    () =>
      db.promptAnswers
        .where("milestoneInstanceId")
        .equals(milestoneInstanceId)
        .first(),
    [milestoneInstanceId]
  );
  const [value, setValue] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Holds the record id from the moment we decide to create one — set
  // synchronously, before any await, so rapid keystrokes can't race the
  // live query into creating duplicate records.
  const recordIdRef = useRef<string | null>(null);
  const pushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (existing && !recordIdRef.current) {
      recordIdRef.current = existing.id;
      setValue(existing.answer);
    }
  }, [existing?.id]);

  useEffect(() => () => {
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
  }, []);

  function schedulePush(id: string) {
    // Dexie is written on every keystroke (cheap, local); Firestore push is
    // debounced so we don't burn a write per character.
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(async () => {
      const record = await db.promptAnswers.get(id);
      if (record) void pushPromptAnswer(record);
    }, PUSH_DEBOUNCE_MS);
  }

  async function save(next: string) {
    setValue(next);
    if (recordIdRef.current) {
      await db.promptAnswers.update(recordIdRef.current, { answer: next });
      schedulePush(recordIdRef.current);
    } else if (next.trim()) {
      const id = nanoid();
      recordIdRef.current = id;
      await db.promptAnswers.add({
        id,
        journeyId,
        milestoneInstanceId,
        prompt,
        answer: next,
        timestamp: new Date().toISOString(),
        createdBy: getCurrentUid(),
      });
      schedulePush(id);
    }
    setSavedAt(Date.now());
  }

  return (
    <div>
      <p className="font-display text-lg text-ink mb-2">{prompt}</p>
      <textarea
        value={value}
        maxLength={MAX_LEN}
        onChange={(e) => save(e.target.value)}
        placeholder="A line or two is plenty…"
        rows={2}
        className="w-full resize-none rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 focus:border-teal outline-none"
      />
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[11px] text-stamp font-mono">
          {savedAt ? "Saved" : ""}
        </span>
        <span className="text-[11px] text-stamp font-mono">
          {value.length}/{MAX_LEN}
        </span>
      </div>
    </div>
  );
}
