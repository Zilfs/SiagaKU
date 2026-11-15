const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Push needs a service worker, the Push API, notification permission and the public VAPID key. */
export function pushDidukung(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

/** Ask for permission, subscribe this browser, and store the subscription for the kelurahan. */
export async function subscribePush(kode: string): Promise<PushSubscription> {
  if (!pushDidukung() || !VAPID_PUBLIC_KEY) {
    throw new Error("Notifikasi push belum dikonfigurasi di perangkat ini.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Izin notifikasi ditolak. Kamu tetap bisa membuka halaman ini.");
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      kode,
    }),
  });
  if (!response.ok) {
    throw new Error("Langganan notifikasi gagal disimpan.");
  }
  return subscription;
}

export async function unsubscribePush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
  await fetch("/api/push/unsubscribe", { method: "POST" }).catch(() => {});
}

export async function sendTestPush(): Promise<void> {
  const response = await fetch("/api/push/test", { method: "POST" });
  if (!response.ok) {
    throw new Error("Notifikasi uji belum bisa dikirim.");
  }
}
