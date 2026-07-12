import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { MilestoneInstance } from "../../types";
import { getMilestoneDefinition } from "../../lib/milestones";
import { PHASE_ORDER, PHASE_TITLE } from "../../lib/bookData";
import { MilestoneCard } from "./MilestoneCard";

interface Props {
  journeyId: string;
  journeyType: string;
  instances: MilestoneInstance[];
}

export function Timeline({ journeyId, journeyType, instances }: Props) {
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const sorted = [...instances].sort((a, b) => a.order - b.order);
    const map: Record<string, MilestoneInstance[]> = {};
    for (const inst of sorted) {
      const def = getMilestoneDefinition(journeyType, inst.key);
      const phase = def?.phase ?? "before";
      (map[phase] ??= []).push(inst);
    }
    return map;
  }, [instances, journeyType]);

  return (
    <div className="pb-24">
      <p className="font-hand text-2xl text-ink mb-4 relative inline-block">
        The story so far
        <span className="absolute -bottom-0.5 left-0 w-3/4 h-[3px] bg-marigold/50 rounded-full" />
      </p>

      {PHASE_ORDER.filter((p) => grouped[p]?.length).map((phase) => (
        <section key={phase} className="mb-8">
          <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-stamp mb-4 pl-[4.5rem]">
            {PHASE_TITLE[phase]}
          </h2>
          {/* dashed rail running behind the scene badges */}
          <div className="relative space-y-4">
            <div
              aria-hidden
              className="absolute left-7 top-4 bottom-4 border-l-2 border-dashed border-ink/10"
            />
            {grouped[phase].map((inst) => {
              const def = getMilestoneDefinition(journeyType, inst.key);
              if (!def) return null;
              return (
                <MilestoneCard
                  key={inst.id}
                  instance={inst}
                  definition={def}
                  onOpen={() => navigate(`/journey/${journeyId}/milestone/${inst.id}`)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
