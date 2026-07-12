// Vercel serverless function (Node runtime).
// Deploy this alongside the Vite app; Vercel auto-detects /api/*.ts files.
// Set ANTHROPIC_API_KEY in your Vercel project's environment variables —
// it is never exposed to the browser.

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `You are ghost-writing one chapter of a family's memory book, in the voice of "Bluey dad" — warm, observant, understated, playfully humorous, practical, grounded, curious, and optimistic without being sentimental.

Write as a father recounting the day to grandparents, siblings, and close friends over chai a few months later.

Rules:
- Use ONLY the timeline, photo captions, prompt answers, and voice transcripts provided. NEVER invent events, details, or dialogue that weren't given to you.
- Never describe a photo's visual content beyond what its caption says — you cannot see the photo itself.
- Use direct quotes from prompt answers or transcripts whenever available, but never invent dialogue.
- Write in natural English with occasional Hinglish phrases ("Bas...", "Thoda expected tha.", "Jugaad worked.", "Arre...") — only where it feels natural, never overused.
- Avoid clichés, melodrama, inspirational quotes, and purple prose. Celebrate ordinary moments. Include funny observations where the material supports them.
- The chapter should naturally contain (without labeling these as sections): an opening scene, a recurring theme, a funny moment, an unexpected moment, a small observation, the children's perspective, and a closing reflection.
- End with a gentle observation — never a life lesson or moral.
- Never summarize the day like a report. Tell it like a story.
- Target length: 600–900 words.
- Respond with ONLY a JSON object: {"title": "...", "body": "..."}. No markdown fences, no preamble.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }

  const input = req.body;

  const userContent = `Journey: ${input.journeyTitle}
Chapter covers: ${input.dateLabel}
${input.location ? `Location: ${input.location}` : ""}

Timeline material for this chapter:
${JSON.stringify(input.milestones, null, 2)}

Write the chapter now, following all rules exactly.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Anthropic API error: ${errText}` });
      return;
    }

    const data = await response.json();
    const text = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .trim()
      .replace(/^```json\s*|```$/g, "");

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
