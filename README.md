# Between Homes

A quiet documentary director for your family's big move. Not a journal, not a
gallery — it nudges you toward the shots and small details you'd otherwise
forget, then turns them into a written chapter later.

## Project Summary

**Between Homes** is an offline-first storytelling application
designed to help families preserve the experience of moving from one home to
another. Rather than functioning as a traditional journal or photo gallery,
the application acts as a quiet documentary director—guiding parents to
capture meaningful moments, everyday details, and brief reflections that
might otherwise be forgotten. As milestones are completed, AI transforms the
family's own photos, prompt responses, and voice notes into narrative
chapters, ultimately producing a professionally formatted digital memory book
grounded entirely in real events.

The application was developed as a mobile-first Progressive Web App (PWA)
using React, TypeScript, Vite, Tailwind CSS, and Framer Motion. The
technology stack is intentionally built on widely adopted, industry-standard
frameworks to maximize maintainability, reliability, and ease of deployment.
The primary architectural decision is an **offline-first, local-first**
design, where **IndexedDB (Dexie)** serves as the primary source of truth and
cloud services are used only for synchronization. This enables the
application to remain fully functional without an internet connection while
automatically synchronizing captured memories across family members whenever
connectivity is restored.

Multi-device collaboration is provided through Firebase Anonymous
Authentication and Firestore, allowing two parents to contribute to the same
journey from separate devices while keeping operational complexity low. AI
chapter generation is isolated behind a serverless API, ensuring API keys are
never exposed to the client while allowing AI models to be updated
independently of the application. The milestone engine itself is modular,
making it straightforward to support additional experiences such as
vacations, newborn milestones, and road trips without requiring architectural
changes.

The user interface was reviewed using
Apple's Human Interface Guidelines, Nielsen's 10 Usability Heuristics, WCAG
2.1 AA accessibility standards, and Google's Progressive Web App quality
checklist. These reviews informed improvements to navigation, safe-area
handling, accessibility, offline feedback, synchronization visibility,
loading and recovery states, responsive layouts, image memory optimization,
touch-first interactions, and overall visual consistency. The resulting
application combines established engineering practices with a calm,
documentary-inspired user experience while remaining deployable at virtually
no operational cost using free-tier cloud services and serverless
infrastructure.

## What's implemented

- **Journey setup** — departure/destination city, date, family members.
- **Auto-generated milestone timeline** — Leaving Home through First Night,
  with documentary-style photo suggestions and one quick (never-emotional)
  prompt per stop, drawn from the product brief.
- **Memory Director card** — one-tap photo capture per suggestion, a single
  200-character prompt answer, and an optional 20-second voice note. Each
  milestone unlocks the next automatically once you mark it done.
- **Two-person shared journey** — a 4-character join code links a second
  parent's device to the same journey. Firestore syncs photos, prompt
  answers, voice notes, and chapters between devices; Dexie (IndexedDB)
  keeps everything working offline and queues anything created without a
  connection until it's back online.
- **AI chapter writer** — once a phase (Before Leaving / At the Airport / In
  the Air / Arrival) is fully captured, a serverless function assembles the
  real timeline data (photo captions, prompt answers, voice transcripts) and
  asks Claude to write a 600-900 word chapter in the specified "Bluey dad"
  voice. It's instructed never to invent events, details, or dialogue.
- **Final book + PDF export** — a cover, chapters with their photos, and an
  "in their own words" quote section, exportable to PDF from the browser.
- **Installable, offline-first PWA** — manifest + service worker, works on
  iPhone and Android, self-hosted fonts so it doesn't depend on a network
  connection to look right.

## What's intentionally simplified in this pass

- **Voice transcription**: voice notes record and play back, and there's a
  `transcript` field ready on the data model, but nothing calls a
  speech-to-text API yet. Wire one into `VoiceRecorder.tsx`'s save step
  (e.g. Whisper via a serverless function, same pattern as the chapter
  writer) and chapters will start using transcripts automatically.
- **Smart proactive reminders**: the brief describes location-aware nudges
  ("you've reached the airport"). Real geofencing needs airport coordinates
  and background location permission, which felt like its own project — this
  build relies on the parent tapping into the active milestone instead.
  Worth adding once the core loop is validated.
- **Only the relocation milestone set is built out.** The architecture
  (`MILESTONE_SETS` in `src/lib/milestones.ts`) is designed so vacation,
  road trip, newborn, etc. are just additional milestone-definition arrays —
  no structural changes needed.

## Architecture

- **React + TypeScript + Vite + Tailwind + Framer Motion**, mobile-first.
- **Dexie (IndexedDB)** is the source of truth on-device; the app works
  fully offline on a single device even with no Firebase configured at all.
- **Firebase** (Anonymous Auth + Firestore) is the thin sync layer that
  makes the join-code, two-parent flow possible. It's optional - leave
  `.env` blank and the app runs local-only. Photos and voice notes sync
  directly through Firestore (compressed to fit its 1 MiB document limit)
  rather than through Firebase Storage, so this all stays on Firebase's
  free Spark plan - no billing account needed. The trade-off: the parent
  who *didn't* take a photo sees a slightly compressed copy of it, not the
  original full-resolution file.
- **A single Vercel serverless function** (`api/generate-chapter.ts`) holds
  the Groq API key server-side and is the only thing that talks to Groq's
  API, so the key is never exposed to the browser. Groq's free tier and
  the open models it hosts (Llama 3.3 70B by default) mean this can run
  at no cost - see "Deploying (Vercel)" below for where to get a key.

```
src/
  types/         data model
  lib/           milestones data, Dexie schema, Firebase, sync engine,
                 journey actions, AI client, PDF export
  components/    Timeline, MemoryCard (photo/prompt/voice), Book, ui
  pages/         Home, NewJourney, JourneyDashboard, MilestonePage,
                 BookPage, JoinJourney
api/
  generate-chapter.ts   serverless chapter writer
firestore.rules  storage.rules   security rules for the shared journey
```

## Running it locally

```bash
npm install
npm run dev
```

The app works immediately with no setup - it just won't sync between two
devices until you add Firebase keys below.

## Setting up two-device sync (Firebase)

1. Create a project at console.firebase.google.com.
2. Add a Web App (</> icon) and copy the config values into `.env`
   (see `.env.example`).
3. Enable **Anonymous** sign-in: Authentication -> Sign-in method.
4. Enable **Firestore** (Build -> Firestore Database -> Create database,
   production mode). Firebase Storage is intentionally not used here since
   it now requires a paid Blaze plan - see the Photo Intelligence note above.
5. Publish the security rules: open Firestore -> Rules tab in the Firebase
   console, paste in the contents of `firestore.rules`, and click Publish.
   No terminal needed.

## Deploying (Vercel)

Vercel auto-detects the Vite app and the `/api` serverless function.

1. `vercel` (or connect the repo in the Vercel dashboard).
2. In the Vercel project's Environment Variables, set:
   - The six `VITE_FIREBASE_*` values from `.env`
   - `GROQ_API_KEY` (server-side only - do not prefix with `VITE_`; get a
     free key at console.groq.com -> API Keys)
3. Deploy. The chapter writer will now work at `/api/generate-chapter`.

Once deployed, install it: open the URL on your phone and use
"Add to Home Screen" (iOS Safari) or the install prompt (Android Chrome).

## Setting up check-in reminders (optional)

This feature nudges a phone with a real push notification if a milestone
has sat "active but uncaptured" for a few hours, and lets the app jump
straight to the arrival milestones if it notices you've landed near your
destination city. It's entirely optional - skip this section and the rest
of the app works exactly the same, just without the nudges.

1. **Generate VAPID keys** (a one-time key pair for Web Push):
   ```bash
   npx web-push generate-vapid-keys
   ```
   Add the public key as `VITE_VAPID_PUBLIC_KEY` and the private key as
   `VAPID_PRIVATE_KEY` in Vercel's Environment Variables. Also set
   `VAPID_SUBJECT` to `mailto:youremail@example.com` (required by the Web
   Push spec, never shown to users).
2. **Get a Firebase service account key**: Firebase console -> gear icon ->
   Project settings -> Service accounts tab -> "Generate new private key."
   This downloads a JSON file. Open it, copy the entire contents, and paste
   them as the value of `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel (raw JSON
   is fine - no need to encode it).
3. **Make up a `CRON_SECRET`**: any random string (e.g. generate one at
   randomkeygen.com), and set it as an env var in Vercel. This is what
   authorizes your external scheduler to trigger the reminder check.
4. **Redeploy** so the new environment variables take effect.
5. **Set up a free external scheduler** - Vercel's own free-tier cron only
   runs once a day, too infrequent to be useful mid-trip. Instead:
   - Sign up free at cron-job.org
   - Create a new cron job pointing at
     `https://your-app.vercel.app/api/check-reminders`
   - Set it to run every 30-60 minutes
   - Add a custom header: `x-cron-secret` = the value you set above
6. Open the app, and on the journey dashboard tap "Get a gentle check-in
   reminder" to opt that phone in (each parent does this on their own
   phone/browser prompt).

## Known trade-off worth knowing about

The Firestore/Storage rules use each journey's join code as the invite
mechanism - anyone who has the code can join. That matches "share a code
with your partner" use, but review `firestore.rules` before using this
beyond trusted family sharing.
