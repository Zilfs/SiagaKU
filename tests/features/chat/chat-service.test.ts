import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllProvidersFailed } from "@/lib/ai/router";
import { memoryCacheStore } from "@/lib/data/cache";
import {
  createChatStream,
  type ChatGenerator,
} from "@/features/chat/server/chat-service";
import type { Source } from "@/features/chat/server/rag/retrieve";

const source: Source = {
  n: 1,
  chunkId: 11,
  title: "Buku Saku Tanggap Tangkas Tangguh",
  publisher: "BNPB",
  page: 23,
  url: "https://bnpb.go.id/buku-saku",
  content: "Isi tas siaga: air minum, makanan ringan, lampu senter.",
};

type Chunk = { type: string; [key: string]: unknown };

async function collect(stream: ReadableStream<Chunk>): Promise<Chunk[]> {
  const out: Chunk[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return out;
    out.push(value);
  }
}

function textOf(chunks: Chunk[]): string {
  return chunks
    .filter((c) => c.type === "text-delta")
    .map((c) => String(c.delta))
    .join("");
}

function metaOf(chunks: Chunk[]) {
  return chunks.find((c) => c.type === "data-meta");
}

function generator(...parts: string[]): ChatGenerator {
  return async () => ({
    provider: "gemini",
    modelId: "gemini-2.5-flash",
    fallback: false,
    text: (async function* () {
      yield* parts;
    })(),
  });
}

const okRetrieve = async () => ({ sources: [source], mode: "vector" as const });

describe("createChatStream", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("streams emergency, sources, text, then meta in order", async () => {
    const chunks = await collect(
      createChatStream(
        {
          messages: [
            { role: "user", content: "Anak saya terjebak di lantai 2" },
          ],
        },
        {
          retrieve: okRetrieve,
          generate: generator("Hubungi 112", " sekarang."),
          cache: memoryCacheStore(),
        },
      ),
    );

    expect(chunks.map((c) => c.type)).toEqual([
      "data-emergency",
      "data-sources",
      "text-start",
      "text-delta",
      "text-delta",
      "text-end",
      "data-meta",
    ]);
    expect(chunks[0].data).toEqual({ active: true });
    expect(chunks[1].data).toEqual({
      items: [
        {
          n: 1,
          chunkId: 11,
          title: "Buku Saku Tanggap Tangkas Tangguh",
          publisher: "BNPB",
          page: 23,
          url: "https://bnpb.go.id/buku-saku",
        },
      ],
    });
    expect(textOf(chunks)).toBe("Hubungi 112 sekarang.");
    expect(metaOf(chunks)?.data).toEqual({
      provider: "gemini",
      model: "gemini-2.5-flash",
      fallback: false,
      cached: false,
    });
  });

  it("does not send an emergency part for a normal question", async () => {
    const chunks = await collect(
      createChatStream(
        { messages: [{ role: "user", content: "Apa isi tas siaga?" }] },
        {
          retrieve: okRetrieve,
          generate: generator("Air minum."),
          cache: memoryCacheStore(),
        },
      ),
    );

    expect(chunks.map((c) => c.type)).not.toContain("data-emergency");
  });

  it("answers with the safe fallback and keeps the emergency card when all providers fail", async () => {
    const fail: ChatGenerator = async () => {
      throw new AllProvidersFailed(["quota", "timeout"]);
    };

    const chunks = await collect(
      createChatStream(
        { messages: [{ role: "user", content: "Air sudah masuk rumah" }] },
        { retrieve: okRetrieve, generate: fail, cache: memoryCacheStore() },
      ),
    );

    expect(chunks.map((c) => c.type)).toContain("data-emergency");
    expect(textOf(chunks)).toContain("Maaf, SiagaKU sedang sibuk");
    expect(metaOf(chunks)?.data).toEqual({
      provider: "template",
      model: null,
      fallback: true,
      cached: false,
    });
  });

  it("caches a single normal message and reports cached meta on the next call", async () => {
    const store = memoryCacheStore();
    const generate = vi.fn(generator("Air minum, makanan, lampu senter."));

    const first = await collect(
      createChatStream(
        { messages: [{ role: "user", content: "  Apa ISI tas siaga? " }] },
        { retrieve: okRetrieve, generate, cache: store },
      ),
    );
    const second = await collect(
      createChatStream(
        { messages: [{ role: "user", content: "apa isi tas siaga?" }] },
        { retrieve: okRetrieve, generate, cache: store },
      ),
    );

    expect(generate).toHaveBeenCalledTimes(1);
    expect(textOf(second)).toBe(textOf(first));
    expect(metaOf(second)?.data).toMatchObject({ cached: true });
    expect(second.find((c) => c.type === "data-sources")?.data).toEqual({
      items: [
        {
          n: 1,
          chunkId: 11,
          title: "Buku Saku Tanggap Tangkas Tangguh",
          publisher: "BNPB",
          page: 23,
          url: "https://bnpb.go.id/buku-saku",
        },
      ],
    });
  });

  it("does not cache when a district context is present", async () => {
    const generate = vi.fn(generator("Jawaban."));

    await collect(
      createChatStream(
        {
          messages: [{ role: "user", content: "Apa isi tas siaga?" }],
          districtId: 12,
        },
        {
          retrieve: okRetrieve,
          areaContext: async () => ({
            name: "Jatinegara",
            level: "Tinggi",
            score: 68,
          }),
          generate,
          cache: memoryCacheStore(),
        },
      ),
    );
    await collect(
      createChatStream(
        {
          messages: [{ role: "user", content: "Apa isi tas siaga?" }],
          districtId: 12,
        },
        {
          retrieve: okRetrieve,
          areaContext: async () => ({
            name: "Jatinegara",
            level: "Tinggi",
            score: 68,
          }),
          generate,
          cache: memoryCacheStore(),
        },
      ),
    );

    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("does not cache an emergency answer", async () => {
    const generate = vi.fn(generator("Hubungi 112."));
    const store = memoryCacheStore();
    const input = {
      messages: [{ role: "user" as const, content: "Anak saya terjebak" }],
    };

    await collect(
      createChatStream(input, { retrieve: okRetrieve, generate, cache: store }),
    );
    await collect(
      createChatStream(input, { retrieve: okRetrieve, generate, cache: store }),
    );

    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("retrieves with the last user message plus the previous user message", async () => {
    const retrieve = vi.fn(okRetrieve);

    await collect(
      createChatStream(
        {
          messages: [
            { role: "user", content: "Apa itu tas siaga?" },
            { role: "assistant", content: "Tas siaga adalah tas darurat." },
            { role: "user", content: "Apa saja isinya?" },
          ],
          districtId: 12,
        },
        {
          retrieve,
          areaContext: async () => null,
          generate: generator("Air minum."),
          cache: memoryCacheStore(),
        },
      ),
    );

    expect(retrieve).toHaveBeenCalledWith(
      "Apa saja isinya? Apa itu tas siaga?",
      5,
    );
  });

  it("passes numbered documents and the area context to the model", async () => {
    const generate = vi.fn(generator("Jawaban."));

    await collect(
      createChatStream(
        {
          messages: [{ role: "user", content: "Apa isi tas siaga?" }],
          districtId: 12,
        },
        {
          retrieve: okRetrieve,
          areaContext: async () => ({
            name: "Jatinegara",
            level: "Tinggi",
            score: 68,
          }),
          generate,
          cache: memoryCacheStore(),
        },
      ),
    );

    const call = generate.mock.calls[0][0];
    expect(call.system).toContain("<dokumen>");
    expect(call.system).toContain("[1] (BNPB — Buku Saku");
    expect(call.system).toContain(
      "<konteks_wilayah>Kecamatan Jatinegara, risiko hari ini: Tinggi (68/100)</konteks_wilayah>",
    );
    expect(call.messages).toEqual([
      { role: "user", content: "Apa isi tas siaga?" },
    ]);
  });

  it("still answers when retrieval fails", async () => {
    const chunks = await collect(
      createChatStream(
        { messages: [{ role: "user", content: "Apa isi tas siaga?" }] },
        {
          retrieve: async () => {
            throw new Error("embedding down");
          },
          generate: generator("Air minum."),
          cache: memoryCacheStore(),
        },
      ),
    );

    expect(chunks.find((c) => c.type === "data-sources")?.data).toEqual({
      items: [],
    });
    expect(textOf(chunks)).toBe("Air minum.");
  });
});
