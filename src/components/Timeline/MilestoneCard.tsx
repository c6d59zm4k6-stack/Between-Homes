import { motion } from "framer-motion";
import { Lock, Check, ChevronRight } from "lucide-react";
import { clsx } from "../../lib/clsx";
import type { MilestoneInstance, MilestoneDefinition } from "../../types";

interface Props {
  instance: MilestoneInstance;
  definition: MilestoneDefinition;
  onOpen: () => void;
}

const phaseLabel: Record<string, string> = {
  before: "DEPARTURE",
  airport: "TERMINAL",
  flight: "IN TRANSIT",
  arrival: "ARRIVAL",
};

export function MilestoneCard({ instance, definition, onOpen }: Props) {
  const locked = instance.status === "locked";
  const captured = instance.status === "captured";
  const active = instance.status === "active";

  return (
    <motion.button
      onClick={locked ? undefined : onOpen}
      disabled={locked}
      whileTap={locked ? undefined : { scale: 0.98 }}
      className={clsx(
        "relative flex w-full text-left rounded-ticket overflow-hidden shadow-card bg-paper",
        locked && "opacity-45 grayscale",
        "border border-ink/10"
      )}
    >
      {/* main stub */}
      <div className="flex-1 px-5 py-4 min-w-0">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-stamp uppercase">
          <span>{phaseLabel[definition.phase]}</span>
          <span className="opacity-40">·</span>
          <span>STOP {String(instance.order + 1).padStart(2, "0")}</span>
        </div>
        <h3 className="font-display text-xl mt-1 text-ink truncate">
          {definition.label}
        </h3>
        {active && (
          <p className="text-xs text-teal-dark mt-1 font-medium">
            Ready to capture · ~{definition.estimatedSeconds}s
          </p>
        )}
        {captured && (
          <p className="text-xs text-stamp mt-1">Captured</p>
        )}
      </div>

      {/* perforation */}
      <div className="relative w-px bg-transparent">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-ink/15" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-dim border border-ink/10" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-dim border border-ink/10" />
      </div>

      {/* right stub: status */}
      <div className="w-16 flex items-center justify-center bg-paper-dim">
        {locked && <Lock className="w-4 h-4 text-stamp" />}
        {active && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2.5 h-2.5 rounded-full bg-marigold"
          />
        )}
        {captured && (
          <div className="rotate-[-14deg] rounded border-2 border-teal px-1.5 py-0.5">
            <Check className="w-4 h-4 text-teal" strokeWidth={3} />
          </div>
        )}
        {!locked && !captured && !active && (
          <ChevronRight className="w-4 h-4 text-ink-soft" />
        )}
      </div>
    </motion.button>
  );
}
