import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { db } from "../lib/db";
import { getMilestoneDefinition } from "../lib/milestones";
import { markMilestoneCaptured } from "../lib/journeyActions";
import { MemoryDirectorCard } from "../components/MemoryCard/MemoryDirectorCard";

export function MilestonePage() {
  const { journeyId, milestoneId } = useParams<{ journeyId: string; milestoneId: string }>();
  const navigate = useNavigate();

  const journey = useLiveQuery(() => db.journeys.get(journeyId!), [journeyId]);
  const instance = useLiveQuery(() => db.milestones.get(milestoneId!), [milestoneId]);

  if (!journey || !instance) return null;
  const definition = getMilestoneDefinition(journey.type, instance.key);
  if (!definition) return null;

  async function handleDone() {
    await markMilestoneCaptured(instance!.id);
    navigate(`/journey/${journeyId}`);
  }

  return (
    <div className="min-h-full px-5 pt-8 pb-10 max-w-md mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-ink-soft text-sm mb-5"
      >
        <ChevronLeft className="w-4 h-4" /> Timeline
      </button>
      <MemoryDirectorCard
        journeyId={journeyId!}
        instance={instance}
        definition={definition}
        onDone={handleDone}
      />
    </div>
  );
}
