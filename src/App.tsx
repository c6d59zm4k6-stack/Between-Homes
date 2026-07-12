import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initAuth, authReady, isFirebaseConfigured } from "./lib/firebase";
import { subscribeToJourney, flushPendingSync } from "./lib/sync";
import { db } from "./lib/db";
import { Home } from "./pages/Home";
import { NewJourney } from "./pages/NewJourney";
import { JourneyDashboard } from "./pages/JourneyDashboard";
import { MilestonePage } from "./pages/MilestonePage";
import { BookPage } from "./pages/BookPage";
import { JoinJourney } from "./pages/JoinJourney";

export default function App() {
  useEffect(() => {
    initAuth();
    if (!isFirebaseConfigured) return;

    // Re-establish live sync for every known journey on startup, and flush
    // anything that was captured while offline (e.g. mid-flight).
    const unsubs: Array<() => void> = [];
    let cancelled = false;
    authReady.then(async (user) => {
      if (cancelled || !user) return;
      const journeys = await db.journeys.toArray();
      for (const j of journeys) {
        unsubs.push(...subscribeToJourney(j.id));
        void flushPendingSync(j.id);
      }
    });

    const onOnline = async () => {
      const journeys = await db.journeys.toArray();
      journeys.forEach((j) => void flushPendingSync(j.id));
    };
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-paper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewJourney />} />
          <Route path="/join/:code" element={<JoinJourney />} />
          <Route path="/journey/:journeyId" element={<JourneyDashboard />} />
          <Route path="/journey/:journeyId/milestone/:milestoneId" element={<MilestonePage />} />
          <Route path="/journey/:journeyId/book" element={<BookPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
