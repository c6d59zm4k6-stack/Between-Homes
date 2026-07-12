import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import { distanceKm } from "../../lib/geocode";
import { getMilestoneDefinition } from "../../lib/milestones";
import type { Journey, MilestoneInstance } from "../../types";

const NEAR_THRESHOLD_KM = 30;

export function LocationNudge({
  journey,
  instances,
}: {
  journey: Journey;
  instances: MilestoneInstance[];
}) {
  const navigate = useNavigate();
  const [target, setTarget] = useState<MilestoneInstance | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!journey.destinationCoords || !("geolocation" in navigator)) return;
    // One-shot read on page open — not continuous background tracking,
    // which mobile browsers don't allow for installed PWAs anyway.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearDestination =
          distanceKm(here, journey.destinationCoords!) < NEAR_THRESHOLD_KM;
        if (!nearDestination) return;

        const nextArrivalStop = instances
          .filter((i) => i.status === "active" || i.status === "locked")
          .filter((i) => getMilestoneDefinition(journey.type, i.key)?.phase === "arrival")
          .sort((a, b) => a.order - b.order)[0];
        if (nextArrivalStop && nextArrivalStop.status === "active") {
          setTarget(nextArrivalStop);
        }
      },
      () => {}, // permission denied or unavailable — just skip the nudge silently
      { maximumAge: 10 * 60 * 1000, timeout: 8000 }
    );
  }, [journey.id]);

  if (!target || dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-marigold/40 bg-marigold/10 px-4 py-3 mb-4">
      <MapPin className="w-4 h-4 text-marigold-dark shrink-0" />
      <p className="text-sm text-ink flex-1">
        Looks like you're near {journey.destinationCity ?? "your destination"} — want to jump to
        the arrival moments?
      </p>
      <button
        onClick={() => navigate(`/journey/${journey.id}/milestone/${target.id}`)}
        className="text-xs font-semibold text-teal-dark shrink-0"
      >
        Jump
      </button>
      <button onClick={() => setDismissed(true)} className="shrink-0" aria-label="Dismiss">
        <X className="w-4 h-4 text-ink-soft" />
      </button>
    </div>
  );
}
