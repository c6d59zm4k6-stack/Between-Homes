import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen } from "lucide-react";
import { db } from "../lib/db";
import { Timeline } from "../components/Timeline/Timeline";
import { JourneyCodeShare } from "../components/Shared/JourneyCodeShare";
import { ReminderToggle } from "../components/Shared/ReminderToggle";
import { LocationNudge } from "../components/Shared/LocationNudge";
import { JourneyScene } from "../components/Shared/JourneyScene";

export function JourneyDashboard() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  const journey = useLiveQuery(() => db.journeys.get(journeyId!), [journeyId]);
  const instances = useLiveQuery(
    () => db.milestones.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );

  if (!journey) return null;

  const capturedCount = instances?.filter((i) => i.status === "captured").length ?? 0;
  const total = instances?.length ?? 0;

  return (
    <div className="min-h-full px-5 pt-8 pb-4 max-w-md mx-auto">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-hand text-lg text-marigold-dark">Our big adventure</p>
          <h1 className="font-display text-3xl text-ink leading-tight">{journey.title}</h1>
          <p className="text-xs text-ink-soft mt-1">
            {capturedCount} of {total} moments captured
          </p>
        </div>
        <button
          onClick={() => navigate(`/journey/${journey.id}/book`)}
          className="w-11 h-11 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 shadow-soft"
          aria-label="Open family book"
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>

      <JourneyScene className="w-full h-auto mb-4 -mx-1" />

      <div className="mb-4">
        <JourneyCodeShare code={journey.joinCode} title={journey.title} />
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
