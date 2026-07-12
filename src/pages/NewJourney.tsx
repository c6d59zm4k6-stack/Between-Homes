import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { NewJourneyForm } from "../components/JourneyCreate/NewJourneyForm";

export function NewJourney() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full px-6 pt-10 pb-10 max-w-md mx-auto">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-ink-soft text-sm mb-6 py-2 -my-2"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="font-display text-3xl text-ink mb-1">A new journey</h1>
      <p className="text-ink-soft text-sm mb-6">
        Just the basics — the Director builds your timeline from here.
      </p>
      <NewJourneyForm />
    </div>
  );
}
