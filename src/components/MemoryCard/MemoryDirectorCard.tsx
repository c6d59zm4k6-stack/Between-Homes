import { motion } from "framer-motion";
import type { MilestoneDefinition, MilestoneInstance } from "../../types";
import { PhotoSuggestions } from "./PhotoSuggestions";
import { PromptInput } from "./PromptInput";
import { VoiceRecorder } from "./VoiceRecorder";
import { Button } from "../ui/Button";

interface Props {
  journeyId: string;
  instance: MilestoneInstance;
  definition: MilestoneDefinition;
  onDone: () => void;
}

export function MemoryDirectorCard({ journeyId, instance, definition, onDone }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-ticket bg-paper shadow-card border border-ink/10 overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4 border-b border-ink/10">
        <p className="font-mono text-[10px] tracking-[0.2em] text-stamp uppercase">
          Memory Director · ~{definition.estimatedSeconds} seconds
        </p>
        <h1 className="font-display text-2xl text-ink mt-1">{definition.label}</h1>
      </div>

      <div className="px-5 py-5 space-y-6">
        <div>
          <p className="text-[11px] font-mono tracking-[0.15em] text-stamp uppercase mb-2.5">
            Photos worth taking
          </p>
          <PhotoSuggestions
            journeyId={journeyId}
            milestoneInstanceId={instance.id}
            suggestions={definition.photoSuggestions}
          />
        </div>

        <div>
          <p className="text-[11px] font-mono tracking-[0.15em] text-stamp uppercase mb-2.5">
            One quick thing
          </p>
          <PromptInput
            journeyId={journeyId}
            milestoneInstanceId={instance.id}
            prompt={instance.assignedPrompt}
          />
        </div>

        <div>
          <p className="text-[11px] font-mono tracking-[0.15em] text-stamp uppercase mb-2.5">
            Optional voice note
          </p>
          <VoiceRecorder journeyId={journeyId} milestoneInstanceId={instance.id} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <Button variant="primary" className="w-full" onClick={onDone}>
          Done with this moment
        </Button>
      </div>
    </motion.div>
  );
}
