import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { db } from "../lib/db";
import { joinJourneyByCode } from "../lib/journeyActions";
import { Button } from "../components/ui/Button";

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
    const journey = await joinJourneyByCode(code);
    setJoining(false);
    if (!journey) {
      setError("No journey found with that code. Double-check with your partner.");
      return;
    }
    navigate(`/journey/${journey.id}`);
  }

  return (
    <div className="min-h-full flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-mono text-[11px] tracking-[0.25em] text-stamp uppercase mb-3">
          Between Homes
        </p>
        <h1 className="font-display text-4xl leading-tight text-ink">
          The story behind
          <br />
          the photos.
        </h1>
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
              <button
                key={j.id}
                onClick={() => navigate(`/journey/${j.id}`)}
                className="w-full text-left rounded-xl border border-ink/10 bg-paper-dim px-4 py-3"
              >
                <p className="font-display text-lg text-ink">{j.title}</p>
                <p className="text-xs text-ink-soft">{j.departureDate}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
