import { useState } from "react";
import { setMemberIdentity } from "../../lib/journeyActions";
import type { Journey } from "../../types";
import { getCurrentUid } from "../../lib/firebase";

/** One-time, one-tap: "whose phone is this?" — so notes and voice memos
 * can be labeled by name instead of "the other phone". */
export function IdentityPicker({ journey }: { journey: Journey }) {
  const [saving, setSaving] = useState(false);
  const uid = getCurrentUid();
  const mine = journey.memberProfiles?.[uid];
  const candidates = (journey.familyMembers ?? []).filter((m) => m.name.trim());

  if (mine || candidates.length === 0) return null;

  async function choose(name: string) {
    setSaving(true);
    await setMemberIdentity(journey.id, name);
    setSaving(false);
  }

  return (
    <div className="rounded-ticket border border-ink/10 bg-card shadow-soft px-4 py-3">
      <p className="text-sm text-ink mb-2">Whose phone is this?</p>
      <div className="flex flex-wrap gap-2">
        {candidates.map((m) => (
          <button
            key={m.id}
            disabled={saving}
            onClick={() => choose(m.name)}
            className="rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-sm text-ink"
          >
            {m.name}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-stamp mt-2">
        So notes and photos can say who they're from. One tap, once per device.
      </p>
    </div>
  );
}
