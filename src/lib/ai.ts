export interface ChapterInputMilestone {
  label: string;
  photos: { caption?: string; timestamp: string }[];
  promptQuestion?: string;
  promptAnswer?: string;
  voiceTranscript?: string;
}

export interface ChapterInput {
  journeyTitle: string;
  dateLabel: string; // e.g. "Day 1 · Leaving Bangalore"
  location?: string;
  milestones: ChapterInputMilestone[];
}

export interface ChapterOutput {
  title: string;
  body: string;
}

/**
 * Calls the serverless /api/generate-chapter function, which holds the
 * Groq API key server-side. The model only ever sees the structured
 * memory data below — timeline, photo captions, prompt answers, voice
 * transcripts — and is instructed never to invent events or dialogue.
 */
export async function generateChapter(input: ChapterInput): Promise<ChapterOutput> {
  const res = await fetch("/api/generate-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chapter generation failed (${res.status}): ${text}`);
  }
  return res.json();
}
