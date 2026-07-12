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
    <div className="space-y-8 pb-24">
      {PHASE_ORDER.filter((p) => grouped[p]?.length).map((phase) => (
        <section key={phase}>
          <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-stamp mb-3 px-1">
            {PHASE_TITLE[phase]}
          </h2>
          <div className="space-y-3">
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
