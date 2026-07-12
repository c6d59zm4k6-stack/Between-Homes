/**
 * Firestore documents have a hard 1 MiB limit. Since we're syncing photos
 * directly through Firestore (no Firebase Storage / no billing plan
 * required), every synced photo has to be shrunk well under that limit.
 * The device that took the photo keeps the original, full-resolution
 * dataUrl in its own local IndexedDB — this compressed copy is only what
 * gets sent to Firestore for the other parent's device to see.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 1000,
  quality = 0.7
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let q = quality;
  let out = canvas.toDataURL("image/jpeg", q);
  // Leave headroom for the rest of the document's fields (~900 KB budget).
  const BUDGET = 900_000;
  while (out.length > BUDGET && q > 0.35) {
    q -= 0.15;
    out = canvas.toDataURL("image/jpeg", q);
  }
  if (out.length > BUDGET) {
    // still too big — shrink dimensions further as a last resort
    const smaller = document.createElement("canvas");
    smaller.width = Math.round(canvas.width * 0.6);
    smaller.height = Math.round(canvas.height * 0.6);
    const sctx = smaller.getContext("2d");
    if (sctx) {
      sctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      out = smaller.toDataURL("image/jpeg", 0.6);
    }
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Small grid thumbnail (~320px, aggressive quality) — a few tens of KB. */
export function makeThumbnail(dataUrl: string): Promise<string> {
  return compressDataUrl(dataUrl, 320, 0.6);
}
