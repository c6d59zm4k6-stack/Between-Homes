import { motion } from "framer-motion";
import {
  Lock, Check, ChevronRight, DoorOpen, Car, TowerControl, Ticket, ShieldCheck,
  Coffee, PlaneTakeoff, UtensilsCrossed, Plane, Sunset, PlaneLanding, Stamp,
  Luggage, CarFront, Home, Soup, Moon, type LucideIcon,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { clsx } from "../../lib/clsx";
import { db } from "../../lib/db";
import type { MilestoneInstance, MilestoneDefinition } from "../../types";

interface Props {
  instance: MilestoneInstance;
  definition: MilestoneDefinition;
  onOpen: () => void;
}

// One quiet illustrated glyph per scene — a hint of the moment, not a cartoon.
const MILESTONE_ICON: Record<string, LucideIcon> = {
  leaving_home: DoorOpen,
  drive_to_airport: Car,
  airport_arrival: TowerControl,
  checkin: Ticket,
  security: ShieldCheck,
  waiting_at_gate: Coffee,
  boarding: PlaneTakeoff,
  takeoff: PlaneTakeoff,
  meal: UtensilsCrossed,
  mid_flight: Plane,
  sunset: Sunset,
  landing: PlaneLanding,
  immigration: Stamp,
  baggage: Luggage,
  first_drive: CarFront,
  first_home: Home,
  first_meal: Soup,
  first_night: Moon,
};

// Each phase of the day carries its own soft color identity.
const PHASE_STYLE: Record<string, { tint: string; deep: string }> = {
  before: { tint: "bg-peach-tint", deep: "text-peach-deep" },
  airport: { tint: "bg-sky-tint", deep: "text-sky-deep" },
  flight: { tint: "bg-lavender-tint", deep: "text-lavender-deep" },
  arrival: { tint: "bg-sage-tint", deep: "text-sage-deep" },
};

export function MilestoneCard({ instance, definition, onOpen }: Props) {
  const locked = instance.status === "locked";
  const captured = instance.status === "captured";
  const skipped = instance.status === "skipped";
  const active = instance.status === "active";

  const Icon = MILESTONE_ICON[definition.key] ?? Plane;
  const phase = PHASE_STYLE[definition.phase] ?? PHASE_STYLE.before;

  const counts = useLiveQuery(async () => {
    if (!captured) return null;
    const [photos, answers, notes] = await Promise.all([
      db.photos.where("milestoneInstanceId").equals(instance.id).count(),
      db.promptAnswers.where("milestoneInstanceId").equals(instance.id).count(),
      db.voiceNotes.where("milestoneInstanceId").equals(instance.id).count(),
    ]);
    return { photos, answers, notes };
  }, [instance.id, captured]);

  return (
    <div className="relative flex items-start gap-4">
      {/* scene badge, sitting on the dashed rail */}
      <div className="relative z-10 shrink-0">
        <div
          className={clsx(
            "w-14 h-14 rounded-full flex items-center justify-center border-4 border-paper",
            locked ? "bg-paper-dim" : phase.tint
          )}
        >
          <Icon
            className={clsx("w-6 h-6", locked ? "text-stamp/50" : phase.deep)}
            strokeWidth={1.75}
          />
        </div>
        {captured && (
          <div className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full bg-sage-deep border-2 border-paper flex items-center justify-center">
            <Check className="w-3 h-3 text-paper" strokeWidth={3} />
          </div>
        )}
      </div>

      <motion.button
        onClick={locked ? undefined : onOpen}
        disabled={locked}
        whileTap={locked ? undefined : { scale: 0.985 }}
        className={clsx(
          "flex-1 min-w-0 text-left rounded-ticket bg-card border border-ink/5 shadow-soft px-5 py-4 mb-1",
          locked && "opacity-55",
          skipped && "opacity-70"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={clsx("font-mono text-[10px] tracking-[0.22em] uppercase", locked ? "text-stamp/60" : phase.deep)}>
              Stop {String(instance.order + 1).padStart(2, "0")}
            </p>
            <h3 className="font-display text-xl text-ink truncate mt-0.5">{definition.label}</h3>
            {definition.tagline && (
              <p className="font-hand text-lg leading-tight text-ink-soft/90">{definition.tagline}</p>
            )}
            {active && (
              <p className="text-xs text-marigold-dark font-medium mt-1.5">
                Ready to capture · ~{definition.estimatedSeconds}s
              </p>
            )}
            {skipped && <p className="text-xs text-stamp mt-1.5">Skipped</p>}
            {captured && counts && (
              <p className="text-xs text-ink-soft mt-1.5">
                {[
                  counts.photos > 0 && `${counts.photos} photo${counts.photos > 1 ? "s" : ""}`,
                  counts.answers > 0 && `${counts.answers} note${counts.answers > 1 ? "s" : ""}`,
                  counts.notes > 0 && `${counts.notes} voice memo${counts.notes > 1 ? "s" : ""}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Captured"}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {locked && <Lock className="w-4 h-4 text-stamp/60" />}
            {active && (
              <motion.span
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="block w-2.5 h-2.5 rounded-full bg-marigold"
              />
            )}
            {!locked && !active && <ChevronRight className="w-4 h-4 text-ink-soft/60" />}
          </div>
        </div>
      </motion.button>
    </div>
  );
}
