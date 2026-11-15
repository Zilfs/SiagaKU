import { z } from "zod";

/** BMKG adm4 code of a DKI subdistrict, e.g. "31.75.10.1004". */
export const SubdistrictCodeSchema = z
  .string()
  .regex(/^31\.\d{2}\.\d{2}\.\d{4}$/);

/** Autocomplete query: letters, spaces, dots, apostrophes and hyphens only. */
export const SubdistrictQuerySchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[\p{L}\s.'-]+$/u);

const EndpointSchema = z.url().max(1000).startsWith("https://");

/** POST /api/push/subscribe: the browser's `PushSubscription.toJSON()` plus the subdistrict. */
export const SubscribeRequestSchema = z.object({
  subscription: z.object({
    endpoint: EndpointSchema,
    keys: z.object({
      p256dh: z.string().min(1).max(200),
      auth: z.string().min(1).max(100),
    }),
  }),
  subdistrictCode: SubdistrictCodeSchema,
});

/** POST /api/push/unsubscribe and /api/push/test. */
export const EndpointRequestSchema = z.object({ endpoint: EndpointSchema });
