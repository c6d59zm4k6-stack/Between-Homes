import type { Photo } from "../types";

/**
 * Saves/shares a photo out of the app. On phones, the native share sheet
 * is the reliable path to "Save Image" / photo library (a plain download
 * link does nothing useful in an installed iOS PWA). On desktop browsers,
 * fall back to a normal file download.
 */
export async function savePhotoToDevice(photo: Photo): Promise<void> {
  if (!photo.dataUrl) return;
  const blob = await (await fetch(photo.dataUrl)).blob();
  const label = (photo.caption ?? "photo").replace(/[^\w]+/g, "-").toLowerCase();
  const file = new File([blob], `${label}-${photo.timestamp.slice(0, 10)}.jpg`, {
    type: blob.type || "image/jpeg",
  });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      // person closed the share sheet — that's fine, not an error
      return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
