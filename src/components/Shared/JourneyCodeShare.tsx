import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { isFirebaseConfigured } from "../../lib/firebase";

export function JourneyCodeShare({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    const joinUrl = `${window.location.origin}/#/join/${code}`;
    if (navigator.share) {
      await navigator.share({
        title: "Join our Between Homes journey",
        text: `Join "${title}" on Between Homes — tap to join: ${joinUrl} (or use code ${code})`,
      });
    } else {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="rounded-xl border border-dashed border-ink/20 px-4 py-3 text-xs text-ink-soft">
        Cloud sync isn't configured yet, so this journey stays on this device only.
        Add Firebase keys to enable sharing with a second parent — see the README.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-ink/15 bg-paper-dim px-4 py-3">
      <div>
        <p className="text-[10px] font-mono tracking-[0.2em] text-stamp uppercase">Journey code</p>
        <p className="font-mono text-lg tracking-[0.3em] text-ink">{code}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="p-2 rounded-full hover:bg-ink/5">
          {copied ? <Check className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4 text-ink-soft" />}
        </button>
        <button onClick={share} className="p-2 rounded-full hover:bg-ink/5">
          <Share2 className="w-4 h-4 text-ink-soft" />
        </button>
      </div>
    </div>
  );
}
