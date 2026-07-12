import { getCurrentUid } from "./firebase";
import { saveSubscription, deleteSubscription } from "./sync";

export type PushSetupResult = "subscribed" | "denied" | "unsupported" | "not-configured";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export async function enableCheckInReminders(journeyId: string): Promise<PushSetupResult> {
  if (!VAPID_PUBLIC_KEY) return "not-configured";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  // navigator.serviceWorker.ready never resolves if registration failed for
  // any reason — a timeout here turns a silent infinite hang into a clear
  // error the person can actually see and report.
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    8000,
    "Service worker did not become ready in time"
  );
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "unsupported";

  await saveSubscription(journeyId, getCurrentUid(), {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return "subscribed";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/** Turns reminders back off: unsubscribes this device and removes its
 * record from Firestore, so the reminder-check endpoint has nothing left
 * to send to. Browser-level notification permission itself can only be
 * revoked from the phone's system settings — this stops Between Homes
 * from sending anything, which is the part actually within our control. */
export async function disableCheckInReminders(journeyId: string): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe().catch(() => {});
  }
  await deleteSubscription(journeyId, getCurrentUid()).catch(() => {});
}

export async function checkInReminderStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
