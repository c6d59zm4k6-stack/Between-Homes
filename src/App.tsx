import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initAuth, authReady, isFirebaseConfigured } from "./lib/firebase";
import { subscribeToJourney, flushPendingSync } from "./lib/sync";
import { db } from "./lib/db";
import { Home } from "./pages/Home";
import { NewJourney } from "./pages/NewJourney";
import { JourneyDashboard } from "./pages/JourneyDashboard";
import { MilestonePage } from "./pages/MilestonePage";
import { BookPage } from "./pages/BookPage";
import { GalleryPage } from "./pages/GalleryPage";
import { JoinJourney } from "./pages/JoinJourney";
import { UpdateToast } from "./components/Shared/UpdateToast";

export default function App() {
  // Fixes a real race: without this gate, a freshly-opened browser (e.g. a
  // second device joining for the first time) could try to create/join a
  // journey before its own anonymous Firebase identity finished being
  // created. Every write is stamped with the device's uid, so a write that
  // fires before auth resolves gets stamped with a fake placeholder id and
  // Firestore's security rules silently reject it — which looks exactly
  // like the app "getting stuck." Waiting for authReady here, once, up
  // front, closes that gap everywhere at once instead of patching every
  // call site that reads getCurrentUid().
  const [authResolved, setAuthResolved] = useState(!isFirebaseConfigured);

  useEffect(() => {
    initAuth();
    if (!isFirebaseConfigured) return;

    const unsubs: Array<() => void> = [];
    let cancelled = false;
    authReady.then(async (user) => {
      if (cancelled) return;
      setAuthResolved(true);
      if (!user) return;
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

  if (!authResolved) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-mono text-xs tracking-[0.2em] text-stamp uppercase animate-pulse">
          Getting things ready…
        </p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-paper">
        <UpdateToast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewJourney />} />
          <Route path="/join/:code" element={<JoinJourney />} />
          <Route path="/journey/:journeyId" element={<JourneyDashboard />} />
          <Route path="/journey/:journeyId/milestone/:milestoneId" element={<MilestonePage />} />
          <Route path="/journey/:journeyId/book" element={<BookPage />} />
          <Route path="/journey/:journeyId/photos" element={<GalleryPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
