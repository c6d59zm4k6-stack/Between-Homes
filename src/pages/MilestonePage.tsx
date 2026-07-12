import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { db } from "../lib/db";
import { getMilestoneDefinition } from "../lib/milestones";
import { markMilestoneCaptured, skipMilestone } from "../lib/journeyActions";
import { MemoryDirectorCard } from "../components/MemoryCard/MemoryDirectorCard";
import { PageLoading, PageNotFound } from "../components/Shared/PageStates";
import { useJourney } from "../lib/useJourneyHelpers";

export function MilestonePage() {
  const { journeyId, milestoneId } = useParams<{ journeyId: string; milestoneId: string }>();
  const navigate = useNavigate();

  const journey = useJourney(journeyId);
  const instance = useLiveQuery(
    async () => (milestoneId ? ((await db.milestones.get(milestoneId)) ?? null) : null),
    [milestoneId]
  );

  if (journey === undefined || instance === undefined) return <PageLoading />;
  if (journey === null || instance === null) return <PageNotFound />;
  const definition = getMilestoneDefinition(journey.type, instance.key);
  if (!definition) return <PageNotFound message="This moment isn't recognized by this version of the app." />;

  async function handleDone() {
    await markMilestoneCaptured(instance!.id);
    navigate(`/journey/${journeyId}`);
  }

  async function handleSkip() {
    await skipMilestone(instance!.id);
    navigate(`/journey/${journeyId}`);
  }

  return (
    <div className="min-h-full px-5 pt-8 pb-10 max-w-md mx-auto">
      <button
        onClick={() => navigate(`/journey/${journeyId}`)}
        className="flex items-center gap-1 text-ink-soft text-sm mb-5 py-2 -my-2"
      >
        <ChevronLeft className="w-4 h-4" /> Timeline
      </button>
      <MemoryDirectorCard
        journeyId={journeyId!}
        instance={instance}
        definition={definition}
        onDone={handleDone}
      />
      <button
        onClick={handleSkip}
        className="w-full text-center text-sm text-stamp mt-4 py-2"
      >
        Skip this moment
      </button>
    </div>
  );
}
