import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Our service worker activates new versions immediately (skipWaiting +
 * clients.claim), but pages that are already open keep running the OLD
 * JavaScript until they reload. This listens for the moment a new version
 * takes control and offers a one-tap reload — otherwise two family phones
 * can quietly run different versions of the app for days.
 */
export function UpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Ignore the very first controllerchange after initial install.
    let hadController = Boolean(navigator.serviceWorker.controller);
    const onChange = () => {
      if (hadController) setShow(true);
      hadController = true;
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 flex items-center gap-3 rounded-ticket bg-ink text-paper px-4 py-3 shadow-card"
      style={{ bottom: "max(env(safe-area-inset-bottom), 1rem)" }}
    >
      <p className="text-sm flex-1">A new version of Between Homes is ready.</p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 rounded-full bg-paper text-ink text-xs font-semibold px-3.5 py-2 shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Update
      </button>
    </div>
  );
}
