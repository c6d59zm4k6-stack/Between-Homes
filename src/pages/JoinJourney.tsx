import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { joinJourneyByCode } from "../lib/journeyActions";

export function JoinJourney() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    joinJourneyByCode(code)
      .then((journey) => {
        if (journey) navigate(`/journey/${journey.id}`, { replace: true });
        else setError("That journey code wasn't found.");
      })
      .catch(() => {
        setError("Couldn't reach the server — check your connection and try again.");
      });
  }, [code]);

  return (
    <div className="min-h-full flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-xl text-ink mb-2">
          {error || "Joining your family's journey…"}
        </p>
        {error && (
          <button onClick={() => navigate("/")} className="text-teal-dark text-sm font-medium">
            Go home
          </button>
        )}
      </div>
    </div>
  );
}
