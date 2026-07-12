import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, Images, ChevronLeft } from "lucide-react";
import { db } from "../lib/db";
import { Timeline } from "../components/Timeline/Timeline";
import { JourneyCodeShare } from "../components/Shared/JourneyCodeShare";
import { ReminderToggle } from "../components/Shared/ReminderToggle";
import { LocationNudge } from "../components/Shared/LocationNudge";
import { JourneyScene } from "../components/Shared/JourneyScene";
import { IdentityPicker } from "../components/Shared/IdentityPicker";
import { OfflineChip } from "../components/Shared/OfflineChip";
import { PageLoading, PageNotFound } from "../components/Shared/PageStates";
import { useJourney } from "../lib/useJourneyHelpers";

export function JourneyDashboard() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  const journey = useJourney(journeyId);
  const instances = useLiveQuery(
    () => db.milestones.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );

  if (journey === undefined) return <PageLoading />;
  if (journey === null) return <PageNotFound />;

  const capturedCount = instances?.filter((i) => i.status === "captured").length ?? 0;
  const total = instances?.length ?? 0;

  return (
    <div className="min-h-full px-5 pt-4 pb-4 max-w-md mx-auto">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-ink-soft text-sm mb-3 py-2 -my-2"
      >
        <ChevronLeft className="w-4 h-4" /> All journeys
      </button>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-hand text-lg text-marigold-dark">Our big adventure</p>
          <h1 className="font-display text-3xl text-ink leading-tight">{journey.title}</h1>
          <p className="text-xs text-ink-soft mt-1">
            {capturedCount} of {total} moments captured
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => navigate(`/journey/${journey.id}/photos`)}
            className="w-11 h-11 rounded-full bg-card border border-ink/10 text-ink flex items-center justify-center shadow-soft"
            aria-label="All photos"
          >
            <Images className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/journey/${journey.id}/book`)}
            className="w-11 h-11 rounded-full bg-ink text-paper flex items-center justify-center shadow-soft"
            aria-label="Open family book"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </div>

      <JourneyScene className="w-full h-auto mb-4 -mx-1" />

      <div className="mb-3">
        <OfflineChip />
      </div>

      <div className="mb-4">
        <JourneyCodeShare code={journey.joinCode} title={journey.title} />
      </div>

      <div className="mb-4">
        <IdentityPicker journey={journey} />
      </div>

      <div className="mb-6">
        <ReminderToggle journeyId={journey.id} />
      </div>

      {instances && <LocationNudge journey={journey} instances={instances} />}

      {instances && (
        <Timeline journeyId={journey.id} journeyType={journey.type} instances={instances} />
      )}
    </div>
  );
}
