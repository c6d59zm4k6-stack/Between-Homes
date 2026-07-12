import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";

/** Quiet sync-status visibility: silent when online (the normal case),
 * a small honest pill when offline so no one assumes a photo already
 * reached the other parent's phone. */
export function OfflineChip() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;
  return (
    <div className="flex items-center gap-2 rounded-full bg-paper-dim border border-ink/10 px-3 py-1.5 text-xs text-ink-soft w-fit">
      <CloudOff className="w-3.5 h-3.5 shrink-0" />
      Offline — everything is saved here and will sync when you're back online
    </div>
  );
}
