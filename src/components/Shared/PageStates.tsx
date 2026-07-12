import { useNavigate } from "react-router-dom";

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <p className="font-mono text-xs tracking-[0.2em] text-stamp uppercase animate-pulse">
        Loading…
      </p>
    </div>
  );
}

export function PageNotFound({ message }: { message?: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-8 text-center">
      <p className="font-display text-2xl text-ink">Hmm, nothing here.</p>
      <p className="text-sm text-ink-soft">
        {message ?? "This journey isn't on this device — it may have been removed, or the link is old."}
      </p>
      <button
        onClick={() => navigate("/")}
        className="rounded-full bg-ink text-paper text-sm font-semibold px-6 py-3 mt-2"
      >
        Go to my journeys
      </button>
    </div>
  );
}
