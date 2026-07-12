import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Images } from "lucide-react";
import { db } from "../lib/db";
import { getMilestoneDefinition } from "../lib/milestones";
import { PhotoLightbox } from "../components/Shared/PhotoLightbox";

export function GalleryPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const journey = useLiveQuery(() => db.journeys.get(journeyId!), [journeyId]);
  const photos = useLiveQuery(
    () => db.photos.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );
  const milestones = useLiveQuery(
    () => db.milestones.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );

  if (!journey) return null;

  const sorted = (photos ?? [])
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // group by milestone, in journey order
  const milestoneById = new Map((milestones ?? []).map((m) => [m.id, m]));
  const groups: { label: string; order: number; photos: typeof sorted }[] = [];
  for (const photo of sorted) {
    const inst = milestoneById.get(photo.milestoneInstanceId);
    const def = inst ? getMilestoneDefinition(journey.type, inst.key) : undefined;
    const label = def?.label ?? "Along the way";
    const order = inst?.order ?? 999;
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, order, photos: [] };
      groups.push(group);
    }
    group.photos.push(photo);
  }
  groups.sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-full px-5 pt-8 pb-16 max-w-md mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-ink-soft text-sm mb-5"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <p className="font-hand text-lg text-marigold-dark">Every picture we took</p>
      <h1 className="font-display text-3xl text-ink leading-tight mb-1">{journey.title}</h1>
      <p className="text-xs text-ink-soft mb-6">
        {sorted.length} photo{sorted.length === 1 ? "" : "s"} so far
      </p>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 rounded-ticket border border-dashed border-ink/15 px-6 py-12 text-ink-soft">
          <Images className="w-6 h-6 text-stamp" />
          <p className="text-sm">
            No photos yet — they'll gather here as you capture moments along the way.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.label} className="mb-7">
          <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-stamp mb-2.5">
            {group.label}
          </h2>
          <div className="grid grid-cols-3 gap-1.5">
            {group.photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(sorted.indexOf(photo))}
                className="aspect-square rounded-lg overflow-hidden border border-ink/5 bg-paper-dim"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption ?? "Journey photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      ))}

      {lightboxIndex !== null && sorted[lightboxIndex] && (
        <PhotoLightbox
          photos={sorted}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
