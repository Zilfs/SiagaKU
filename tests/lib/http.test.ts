import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpError, jsonError, parseJson } from "@/lib/http";

const schema = z.object({ name: z.string() });

const post = (body: string) =>
  new Request("http://x", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });

describe("jsonError", () => {
  it("returns the standard error shape", async () => {
    const res = jsonError("NOT_FOUND", "Tidak ditemukan.", 404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Tidak ditemukan." },
    });
  });
});

describe("parseJson", () => {
  it("returns the parsed body", async () => {
    await expect(parseJson(post('{"name":"a"}'), schema)).resolves.toEqual({
      name: "a",
    });
  });

  it("throws HttpError 400 INVALID_INPUT on a broken body", async () => {
    const err = await parseJson(post("{not json"), schema).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });

  it("throws HttpError 400 INVALID_INPUT when the schema fails", async () => {
    const err = await parseJson(post('{"name":1}'), schema).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });

  it("HttpError converts to a jsonError response", async () => {
    const res = new HttpError("INVALID_INPUT", "x", 400).toResponse();
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_INPUT");
  });
});
