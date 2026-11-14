import { z } from "zod";

/** Minimal RFC 4180 parser: quoted fields, "" escapes, commas/newlines in quotes, CRLF, blank lines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((f) => f.trim() !== ""));
  const [header, ...body] = nonEmpty;
  if (!header) return [];
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])),
  );
}

const text = z.string().min(1);
const optText = z.string().transform((v) => (v === "" ? null : v));
const optInt = z
  .string()
  .transform((v) => (v === "" ? null : Number(v)))
  .pipe(z.number().int().nonnegative().nullable());
const num = z.coerce.number().finite();
const bool = z.enum(["true", "false"]).transform((v) => v === "true");
const url = z.url();

export const DistrictRow = z.object({
  id: z.coerce.number().int().positive(),
  slug: text,
  name: text,
  city: text,
  region_code: text,
  bmkg_adm4: text,
  lat: num,
  lng: num,
  tidal_flood_prone: bool,
  notes: optText,
});

export const FloodEventRow = z.object({
  district_slug: text,
  subdistrict: optText,
  event_date: z.iso.date(),
  max_depth_cm: optInt,
  affected_rt_count: optInt,
  description: optText,
  source_url: url,
});

export const FloodProneRow = z.object({
  district_slug: text,
  subdistrict: text,
  rw_count: optInt,
  data_year: optInt,
  source_url: url,
});

export const ShelterRow = z.object({
  district_slug: text,
  name: text,
  type: z.enum([
    "official_post",
    "subdistrict_office",
    "school",
    "mosque",
    "other",
  ]),
  address: optText,
  lat: num,
  lng: num,
  is_verified: bool,
  source_url: z.union([url, z.literal("").transform(() => null)]),
});

export const EmergencyContactRow = z.object({
  name: text,
  phone: text,
  scope: text,
  sort_order: z.coerce.number().int(),
});

/** Parses and validates every row; throws one error listing the first bad rows (line numbers are 1-based, header = 1). */
export function validateRows<T>(
  file: string,
  rows: Record<string, string>[],
  schema: z.ZodType<T>,
): T[] {
  const out: T[] = [];
  const errors: string[] = [];
  rows.forEach((row, i) => {
    const r = schema.safeParse(row);
    if (r.success) out.push(r.data);
    else
      errors.push(
        `${file}:${i + 2} ${r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`,
      );
  });
  if (errors.length > 0) {
    throw new Error(
      `${errors.length} invalid rows:\n${errors.slice(0, 10).join("\n")}`,
    );
  }
  return out;
}
