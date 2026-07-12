import type { Journey, Chapter, Photo, PromptAnswer } from "../../types";
import { JourneyScene } from "../Shared/JourneyScene";

interface Props {
  journey: Journey;
  chapters: Chapter[];
  photosByChapter: Record<string, Photo[]>;
  favoriteAnswers: PromptAnswer[];
  innerRef: React.RefObject<HTMLDivElement | null>;
}

export function FinalBook({ journey, chapters, photosByChapter, favoriteAnswers, innerRef }: Props) {
  return (
    <div ref={innerRef} className="bg-paper">
      {/* cover */}
      <section className="min-h-[60vh] flex flex-col justify-between px-8 pt-14 pb-0 bg-sky-tint rounded-ticket overflow-hidden border border-ink/5">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-sky-deep">
            A Between Homes Book
          </p>
          <h1 className="font-display text-5xl leading-[1.05] mt-4 text-ink">{journey.title}</h1>
          <p className="text-ink-soft mt-4">
            {journey.familyMembers.map((m) => m.name).filter(Boolean).join(", ")}
          </p>
          <p className="font-mono text-xs text-stamp mt-1">{journey.departureDate}</p>
        </div>
        <JourneyScene className="w-full h-auto mt-10" />
      </section>

      {/* chapters */}
      {chapters.map((chapter) => (
        <section key={chapter.id} className="px-6 py-10 border-b border-ink/10">
          <p className="font-mono text-[10px] tracking-[0.25em] text-stamp uppercase mb-2">
            Chapter
          </p>
          <h2 className="font-display text-3xl text-ink mb-5">{chapter.title}</h2>

          {photosByChapter[chapter.id]?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {photosByChapter[chapter.id].slice(0, 6).map((p) => (
                <img
                  key={p.id}
                  src={p.thumbUrl ?? p.dataUrl}
                  alt={p.caption ?? ""}
                  className="aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          <div className="prose-story">
            {chapter.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink-soft mb-4">
                {para}
              </p>
            ))}
          </div>
        </section>
      ))}

      {favoriteAnswers.length > 0 && (
        <section className="px-6 py-10">
          <p className="font-hand text-2xl text-ink mb-4 relative inline-block">
            In their own words
            <span className="absolute -bottom-0.5 left-0 w-3/4 h-[3px] bg-marigold/50 rounded-full" />
          </p>
          <div className="space-y-4">
            {favoriteAnswers.map((a) => (
              <blockquote key={a.id} className="border-l-2 border-marigold pl-4">
                <p className="font-display italic text-lg text-ink">"{a.answer}"</p>
                <p className="text-xs text-stamp mt-1">{a.prompt}</p>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
