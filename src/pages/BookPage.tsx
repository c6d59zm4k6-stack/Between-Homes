import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { ChevronLeft, Download, Sparkles } from "lucide-react";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { generateChapter } from "../lib/ai";
import { pushChapter } from "../lib/sync";
import { PHASE_ORDER, PHASE_TITLE, groupByPhase, isPhaseComplete, assembleChapterInput } from "../lib/bookData";
import { exportNodeToPdf } from "../lib/pdfExport";
import { FinalBook } from "../components/Book/FinalBook";
import { Button } from "../components/ui/Button";
import type { Photo } from "../types";

export function BookPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const bookRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const journey = useLiveQuery(() => db.journeys.get(journeyId!), [journeyId]);
  const instances = useLiveQuery(
    () => db.milestones.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );
  const chapters = useLiveQuery(
    () => db.chapters.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );
  const allPhotos = useLiveQuery(
    () => db.photos.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );
  const allAnswers = useLiveQuery(
    () => db.promptAnswers.where("journeyId").equals(journeyId!).toArray(),
    [journeyId]
  );

  if (!journey || !instances) return null;

  const grouped = groupByPhase(instances, journey.type);
  const writtenPhases = new Set((chapters ?? []).map((c) => c.phase));

  async function handleGenerate(phase: string) {
    setError("");
    setGenerating(phase);
    try {
      const input = await assembleChapterInput(journey!.title, journey!.type, phase, grouped[phase]);
      const output = await generateChapter(input);
      const chapter = {
        id: nanoid(),
        journeyId: journey!.id,
        milestoneInstanceIds: grouped[phase].map((i) => i.id),
        phase,
        title: output.title,
        body: output.body,
        generatedAt: new Date().toISOString(),
        photoIds: [],
      };
      await db.chapters.add(chapter);
      void pushChapter(chapter);
    } catch {
      setError(
        "Couldn't reach the chapter writer. Make sure GROQ_API_KEY is set on your deployment — see the README."
      );
    } finally {
      setGenerating(null);
    }
  }

  async function handleExport() {
    if (!bookRef.current) return;
    setExporting(true);
    try {
      await exportNodeToPdf(bookRef.current, `${journey!.title.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const photosByChapter: Record<string, Photo[]> = {};
  (chapters ?? []).forEach((c) => {
    photosByChapter[c.id] = (allPhotos ?? []).filter((p) =>
      c.milestoneInstanceIds.includes(p.milestoneInstanceId)
    );
  });

  const favoriteAnswers = (allAnswers ?? []).filter((a) => a.answer.trim().length > 0).slice(0, 5);

  const readyPhases = PHASE_ORDER.filter(
    (p) => grouped[p]?.length && isPhaseComplete(grouped[p]) && !writtenPhases.has(p)
  );

  const sortedChapters = [...(chapters ?? [])].sort(
    (a, b) =>
      PHASE_ORDER.indexOf(a.phase as (typeof PHASE_ORDER)[number]) -
      PHASE_ORDER.indexOf(b.phase as (typeof PHASE_ORDER)[number])
  );

  return (
    <div className="min-h-full max-w-md mx-auto pb-16">
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-soft text-sm">
          <ChevronLeft className="w-4 h-4" /> Timeline
        </button>
        <Button variant="secondary" onClick={handleExport} disabled={exporting || !chapters?.length}>
          <Download className="w-4 h-4" /> {exporting ? "Exporting…" : "Export PDF"}
        </Button>
      </div>

      {readyPhases.length > 0 && (
        <div className="px-5 mb-4 space-y-2">
          {readyPhases.map((phase) => (
            <button
              key={phase}
              onClick={() => handleGenerate(phase)}
              disabled={generating === phase}
              className="w-full flex items-center gap-2 rounded-xl border border-dashed border-teal/50 bg-teal/5 px-4 py-3 text-sm text-teal-dark font-medium"
            >
              <Sparkles className="w-4 h-4" />
              {generating === phase
                ? "Writing the chapter…"
                : `Write the "${PHASE_TITLE[phase]}" chapter`}
            </button>
          ))}
        </div>
      )}
      {error && <p className="px-5 text-xs text-clay mb-4">{error}</p>}

      {!chapters?.length && !readyPhases.length && (
        <p className="px-5 text-sm text-ink-soft">
          Capture a few more milestones and your chapters will be ready to write.
        </p>
      )}

      <FinalBook
        journey={journey}
        chapters={sortedChapters}
        photosByChapter={photosByChapter}
        favoriteAnswers={favoriteAnswers}
        innerRef={bookRef}
      />
    </div>
  );
}
