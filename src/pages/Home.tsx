import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { db } from "../lib/db";
import { joinJourneyByCode, removeJourneyFromDevice } from "../lib/journeyActions";
import { Button } from "../components/ui/Button";
import { JourneyScene } from "../components/Shared/JourneyScene";

export function Home() {
  const navigate = useNavigate();
  const journeys = useLiveQuery(() => db.journeys.toArray(), []);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setError("");
    try {
      const journey = await joinJourneyByCode(code);
      if (!journey) {
        setError("No journey found with that code. Double-check with your partner.");
        return;
      }
      navigate(`/journey/${journey.id}`);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-hand text-2xl text-marigold-dark mb-1">Between Homes</p>
        <h1 className="font-display text-4xl leading-tight text-ink">
          The story behind
          <br />
          the photos.
        </h1>
        <JourneyScene className="w-full h-auto mt-5" />
        <p className="text-ink-soft mt-4 leading-relaxed">
          Not a journal. Not a gallery. A quiet director in your pocket —
          nudging you toward the shots and small details you'd otherwise
          forget, on the day you move your whole life across the world.
        </p>
      </motion.div>

      <div className="mt-10 space-y-3">
        <Button className="w-full" onClick={() => navigate("/new")}>
          Start a new journey
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => setShowJoin((s) => !s)}>
          Join with a code
        </Button>

        {showJoin && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleJoin}
            className="pt-1 space-y-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7F2KQM"
              maxLength={6}
              className="w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-3 text-sm font-mono tracking-widest text-center focus:border-teal outline-none"
            />
            {error && <p className="text-xs text-clay">{error}</p>}
            <Button type="submit" variant="secondary" className="w-full" disabled={joining || !code}>
              {joining ? "Joining…" : "Join journey"}
            </Button>
          </motion.form>
        )}
      </div>

      {journeys && journeys.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-mono tracking-[0.2em] text-stamp uppercase mb-2">
            Continue
          </p>
          <div className="space-y-2">
            {journeys.map((j) => (
              <div
                key={j.id}
                className="flex items-center rounded-ticket border border-ink/5 bg-card shadow-soft"
              >
                <button
                  onClick={() => navigate(`/journey/${j.id}`)}
                  className="flex-1 min-w-0 text-left px-4 py-3"
                >
                  <p className="font-display text-lg text-ink truncate">{j.title}</p>
                  <p className="text-xs text-ink-soft">{formatDate(j.departureDate)}</p>
                </button>
                <button
                  onClick={async () => {
                    const sure = window.confirm(
                      `Remove "${j.title}" from this device? The cloud copy and other devices keep it — rejoin anytime with code ${j.joinCode}.`
                    );
                    if (sure) await removeJourneyFromDevice(j.id);
                  }}
                  className="p-3 mr-1 text-stamp"
                  aria-label={`Remove ${j.title} from this device`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}
