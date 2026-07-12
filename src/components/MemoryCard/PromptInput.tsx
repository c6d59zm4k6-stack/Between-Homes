import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../lib/db";
import { pushPromptAnswer } from "../../lib/sync";
import { getCurrentUid } from "../../lib/firebase";
import { useMemberName } from "../../lib/useJourneyHelpers";

const MAX_LEN = 200;
const PUSH_DEBOUNCE_MS = 900;

interface Props {
  journeyId: string;
  milestoneInstanceId: string;
  prompt: string;
}

export function PromptInput({ journeyId, milestoneInstanceId, prompt }: Props) {
  // Everyone's answers for this milestone — each family member writes
  // their own; this device can only edit its own.
  const answers = useLiveQuery(
    () =>
      db.promptAnswers
        .where("milestoneInstanceId")
        .equals(milestoneInstanceId)
        .toArray(),
    [milestoneInstanceId]
  );
  const uid = getCurrentUid();
  const mine = answers?.find((a) => a.createdBy === uid);
  const others = (answers ?? []).filter((a) => a.createdBy !== uid && a.answer.trim());
  const nameFor = useMemberName(journeyId);

  const [value, setValue] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Set synchronously before any await when we create a record, so rapid
  // keystrokes can't race the live query into creating duplicates.
  const recordIdRef = useRef<string | null>(null);
  const pushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mine && !recordIdRef.current) {
      recordIdRef.current = mine.id;
      setValue(mine.answer);
    }
  }, [mine?.id]);

  useEffect(() => () => {
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
  }, []);

  function schedulePush(id: string) {
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
        createdBy: uid,
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
        <span className="text-[11px] text-stamp font-mono">{savedAt ? "Saved" : ""}</span>
        <span className="text-[11px] text-stamp font-mono">
          {value.length}/{MAX_LEN}
        </span>
      </div>

      {others.length > 0 && (
        <div className="mt-3 space-y-2">
          {others.map((a) => (
            <blockquote
              key={a.id}
              className="border-l-2 border-marigold/60 pl-3 py-0.5"
            >
              <p className="font-hand text-lg leading-snug text-ink">"{a.answer}"</p>
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-stamp mt-0.5">
                {nameFor(a.createdBy) ?? "From another device"}
              </p>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
