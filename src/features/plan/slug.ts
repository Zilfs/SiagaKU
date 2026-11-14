import { randomInt } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 10-character share slug for /rencana/[slug] (docs/07 API Spec). */
export function generateSlug(length = 10): string {
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += ALPHABET[randomInt(ALPHABET.length)];
  }
  return slug;
}
