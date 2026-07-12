import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";
import {
  enableCheckInReminders,
  disableCheckInReminders,
  checkInReminderStatus,
} from "../../lib/push";

export function ReminderToggle({ journeyId }: { journeyId: string }) {
  const [status, setStatus] = useState<
    "unknown" | "granted" | "denied" | "default" | "unsupported" | "not-configured"
  >("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkInReminderStatus().then((s) => setStatus(s));
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    try {
      const result = await enableCheckInReminders(journeyId);
      if (result === "subscribed") setStatus("granted");
      else if (result === "denied") setStatus("denied");
      else if (result === "unsupported") setStatus("unsupported");
      else setStatus("not-configured");
    } catch (err) {
      // A stuck spinner with no explanation is worse than a plain error —
      // this is what used to hang forever on "Enabling…".
      setError(
        "Couldn't turn on reminders. This usually means the app's push setup " +
          "isn't finished yet (see the README's check-in reminders section)."
      );
      console.error("enableCheckInReminders failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      await disableCheckInReminders(journeyId);
      setStatus("default");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported" || status === "not-configured" || status === "unknown") return null;

  if (status === "granted") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-teal-dark">
          <BellRing className="w-3.5 h-3.5 shrink-0" />
          Check-in reminders on
        </div>
        <button
          onClick={handleDisable}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-stamp self-start border border-ink/15 rounded-full px-3 py-1.5"
        >
          <BellOff className="w-3.5 h-3.5 shrink-0" />
          {busy ? "Turning off…" : "Turn off reminders"}
        </button>
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
    <div>
      <button
        onClick={handleEnable}
        disabled={busy}
        className="flex items-center gap-2 text-xs text-ink-soft border border-ink/15 rounded-full px-3 py-1.5"
      >
        <Bell className="w-3.5 h-3.5" />
        {busy ? "Enabling…" : "Get a gentle check-in reminder"}
      </button>
      {error && <p className="text-xs text-clay mt-1.5">{error}</p>}
    </div>
  );
}
