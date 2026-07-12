import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { enableCheckInReminders, checkInReminderStatus } from "../../lib/push";

export function ReminderToggle({ journeyId }: { journeyId: string }) {
  const [status, setStatus] = useState<
    "unknown" | "granted" | "denied" | "default" | "unsupported" | "not-configured"
  >("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkInReminderStatus().then((s) => setStatus(s));
  }, []);

  async function handleEnable() {
    setBusy(true);
    const result = await enableCheckInReminders(journeyId);
    setBusy(false);
    if (result === "subscribed") setStatus("granted");
    else if (result === "denied") setStatus("denied");
    else setStatus(result === "unsupported" ? "unsupported" : "not-configured");
  }

  if (status === "unsupported" || status === "not-configured" || status === "unknown") return null;

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2 text-xs text-teal-dark">
        <BellRing className="w-3.5 h-3.5" />
        Check-in reminders on
      </div>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-xs text-stamp">
        Reminders are blocked in your browser settings — you can turn them back on from your
        phone's notification settings for this app.
      </p>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={busy}
      className="flex items-center gap-2 text-xs text-ink-soft border border-ink/15 rounded-full px-3 py-1.5"
    >
      <Bell className="w-3.5 h-3.5" />
      {busy ? "Enabling…" : "Get a gentle check-in reminder"}
    </button>
  );
}
