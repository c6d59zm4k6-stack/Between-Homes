// Vercel serverless function. NOT registered in vercel.json as a Vercel
// Cron Job on purpose — Vercel's Hobby plan only allows those to run once
// a day, which is too infrequent to be a useful travel-day reminder.
// Instead, point a free external scheduler (e.g. cron-job.org) at this
// URL every 30-60 minutes, with the CRON_SECRET below as a header.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import webpush from "web-push";

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not configured");
  // Accepts the service account JSON pasted in directly, or base64-encoded
  // — whichever is easier to paste into Vercel without mangling quotes.
  const trimmed = key.trim();
  const raw = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf-8");
  const serviceAccount = JSON.parse(raw);
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const REMINDER_COOLDOWN_HOURS = 4; // don't nudge the same journey more often than this
const STALE_AFTER_HOURS = 3; // nudge if a milestone's sat active-but-uncaptured this long

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    getAdminApp();
    const db = admin.firestore();

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:hello@example.com",
      process.env.VITE_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const journeysSnap = await db.collection("journeys").get();
    let sent = 0;

    for (const journeyDoc of journeysSnap.docs) {
      const journey = journeyDoc.data();
      const now = Date.now();

      const lastReminder = journey.lastReminderAt
        ? new Date(journey.lastReminderAt).getTime()
        : 0;
      if (now - lastReminder < REMINDER_COOLDOWN_HOURS * 3600 * 1000) continue;

      const milestonesSnap = await journeyDoc.ref.collection("milestones").get();
      const staleActive = milestonesSnap.docs.find((m) => {
        const data = m.data();
        if (data.status !== "active" || !data.unlockedAt) return false;
        const unlockedMs = new Date(data.unlockedAt).getTime();
        return now - unlockedMs > STALE_AFTER_HOURS * 3600 * 1000;
      });
      if (!staleActive) continue;

      const subsSnap = await journeyDoc.ref.collection("subscriptions").get();
      if (subsSnap.empty) continue;

      const payload = JSON.stringify({
        title: "Between Homes",
        body: "Still on the move? A quick photo or line takes 20 seconds.",
        url: `/#/journey/${journeyDoc.id}`,
      });

      await Promise.all(
        subsSnap.docs.map(async (subDoc) => {
          const sub = subDoc.data();
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
            sent++;
          } catch (err) {
            const statusCode = (err as { statusCode?: number })?.statusCode;
            // subscription expired or the browser un-registered it — clean up
            if (statusCode === 404 || statusCode === 410) {
              await subDoc.ref.delete();
            }
          }
        })
      );

      await journeyDoc.ref.update({ lastReminderAt: new Date().toISOString() });
    }

    res.status(200).json({ ok: true, journeysChecked: journeysSnap.size, notificationsSent: sent });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
