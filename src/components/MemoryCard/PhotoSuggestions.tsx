import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, Check } from "lucide-react";
import { nanoid } from "nanoid";
import { db } from "../../lib/db";
import { pushPhoto } from "../../lib/sync";
import { getCurrentUid } from "../../lib/firebase";
import { makeThumbnail } from "../../lib/imageCompress";
import { PhotoLightbox } from "../Shared/PhotoLightbox";
import type { Photo } from "../../types";

interface Props {
  journeyId: string;
  milestoneInstanceId: string;
  suggestions: string[];
}

export function PhotoSuggestions({ journeyId, milestoneInstanceId, suggestions }: Props) {
  const photos = useLiveQuery(
    () => db.photos.where("milestoneInstanceId").equals(milestoneInstanceId).toArray(),
    [milestoneInstanceId]
  );
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = (photos ?? []).slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  function photoFor(suggestion: string) {
    return sorted.find((p) => p.caption === suggestion);
  }

  function openCameraFor(suggestion: string) {
    setActiveSuggestion(suggestion);
    inputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeSuggestion) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const uid = getCurrentUid();
    const thumbUrl = await makeThumbnail(dataUrl).catch(() => undefined);
    // Retaking replaces YOUR earlier photo for this suggestion (same id, so
    // the sync overwrites cleanly) — but never touches the other parent's
    // photo of the same scene.
    const existingMine = sorted.find((p) => p.caption === activeSuggestion && p.createdBy === uid);

    const photo: Photo = {
      id: existingMine?.id ?? nanoid(),
      journeyId,
      milestoneInstanceId,
      dataUrl,
      thumbUrl,
      caption: activeSuggestion,
      timestamp: new Date().toISOString(),
      createdBy: uid,
    };
    await db.photos.put(photo);
    void pushPhoto(photo);
    setActiveSuggestion(null);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <div className="grid grid-cols-2 gap-2.5">
        {suggestions.map((s) => {
          const photo = photoFor(s);
          return (
            <button
              key={s}
              onClick={() => {
                // Filled slot → open the viewer (retake lives inside it).
                // Empty slot → straight to the camera.
                if (photo) setLightboxIndex(sorted.indexOf(photo));
                else openCameraFor(s);
              }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-ink/10 bg-paper-dim text-left"
            >
              {photo ? (
                <img src={photo.thumbUrl ?? photo.dataUrl} alt={s} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5 px-2">
                  <Camera className="w-5 h-5 text-stamp" />
                  <span className="text-[11px] text-ink-soft text-center leading-tight">
                    {s}
                  </span>
                </div>
              )}
              {photo && (
                <div className="absolute top-1.5 right-1.5 bg-sage-deep rounded-full p-1">
                  <Check className="w-3 h-3 text-paper" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && sorted[lightboxIndex] && (
        <PhotoLightbox
          photos={sorted}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onRetake={(photo) => {
            setLightboxIndex(null);
            if (photo.caption) openCameraFor(photo.caption);
          }}
        />
      )}
    </div>
  );
}
