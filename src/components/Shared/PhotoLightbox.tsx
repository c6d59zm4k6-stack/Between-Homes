import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Camera } from "lucide-react";
import { savePhotoToDevice } from "../../lib/photoActions";
import type { Photo } from "../../types";

interface Props {
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
  onRetake?: (photo: Photo) => void;
}

export function PhotoLightbox({ photos, startIndex, onClose, onRetake }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const photo = photos[index];
  if (!photo) return null;

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null || photos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -50) setIndex((i) => (i + 1) % photos.length);
    else if (dx > 50) setIndex((i) => (i - 1 + photos.length) % photos.length);
    setTouchStartX(null);
  }

  function download() {
    // Native share sheet first (the reliable route to "Save Image" on an
    // installed iOS PWA), blob-download fallback for desktop browsers.
    void savePhotoToDevice(photo);
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 flex flex-col" onClick={onClose}>
      {/* top bar */}
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-paper/70 text-xs font-mono">
          {index + 1} / {photos.length}
        </p>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-paper/10 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-paper" />
        </button>
      </div>

      {/* photo */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={photo.dataUrl}
          alt={photo.caption ?? "Photo"}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
      </div>

      {/* caption + actions */}
      <div
        className="px-5 pt-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {photo.caption && (
          <p className="text-paper text-center text-sm mb-1">{photo.caption}</p>
        )}
        <p className="text-paper/50 text-center text-[11px] mb-4">
          {new Date(photo.timestamp).toLocaleString()}
        </p>
        <div className="flex items-center justify-center gap-3">
          {photos.length > 1 && (
            <button
              onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
              className="w-11 h-11 rounded-full bg-paper/10 flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 text-paper" />
            </button>
          )}
          <button
            onClick={download}
            className="flex items-center gap-2 rounded-full bg-paper text-ink px-5 py-2.5 text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Save photo
          </button>
          {onRetake && (
            <button
              onClick={() => onRetake(photo)}
              className="flex items-center gap-2 rounded-full bg-paper/10 text-paper px-4 py-2.5 text-sm"
            >
              <Camera className="w-4 h-4" /> Retake
            </button>
          )}
          {photos.length > 1 && (
            <button
              onClick={() => setIndex((i) => (i + 1) % photos.length)}
              className="w-11 h-11 rounded-full bg-paper/10 flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 text-paper" />
            </button>
          )}
        </div>
        <p className="text-paper/40 text-center text-[11px] mt-3">
          On iPhone you can also press and hold the photo to save it.
        </p>
      </div>
    </div>
  );
}
