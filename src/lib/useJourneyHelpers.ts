import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { getCurrentUid } from "./firebase";

/**
 * Loads a journey with a three-state result so pages can tell "still
 * loading" apart from "genuinely not on this device":
 *   undefined → loading, null → not found, Journey → found.
 */
export function useJourney(journeyId: string | undefined) {
  return useLiveQuery(
    async () => (journeyId ? ((await db.journeys.get(journeyId)) ?? null) : null),
    [journeyId]
  );
}

/** Maps a record's createdBy uid to a family member's name, if this
 * journey's devices have introduced themselves. */
export function useMemberName(journeyId: string) {
  const journey = useJourney(journeyId);
  return (uid: string): string | null => journey?.memberProfiles?.[uid] ?? null;
}

export function useMyIdentity(journeyId: string) {
  const journey = useJourney(journeyId);
  return journey?.memberProfiles?.[getCurrentUid()] ?? null;
}
