import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const rpc = vi.fn();
  const inIds = vi.fn();
  const select = vi.fn(() => ({ in: inIds }));
  const from = vi.fn(() => ({ select }));
  return { rpc, inIds, select, from, client: { rpc, from } };
});

vi.mock("@/lib/db/client", () => ({
  supabaseServer: () => db.client,
}));

vi.mock("@/lib/rag/embed", () => ({
  embedTexts: vi.fn(),
}));

import { embedTexts } from "@/lib/rag/embed";
import { buildContext, retrieve, type Source } from "@/lib/rag/retrieve";

const mockEmbed = vi.mocked(embedTexts);

const chunkRow = {
  id: 11,
  document_id: 1,
  content: "Isi tas siaga: air minum, makanan ringan, lampu senter.",
  page: 23,
  section_title: "Tas siaga",
  similarity: 0.82,
};

const documentRow = {
  id: 1,
  title: "Buku Saku Tanggap Tangkas Tangguh",
  publisher: "BNPB",
  url: "https://bnpb.go.id/buku-saku",
};

beforeEach(() => {
  vi.clearAllMocks();
  db.inIds.mockResolvedValue({ data: [documentRow], error: null });
});

describe("retrieve", () => {
  it("returns numbered sources from the vector search", async () => {
    mockEmbed.mockResolvedValue([Array.from({ length: 768 }, () => 0.1)]);
    db.rpc.mockResolvedValue({ data: [chunkRow], error: null });

    const result = await retrieve("isi tas siaga bencana");

    expect(mockEmbed).toHaveBeenCalledWith(
      ["isi tas siaga bencana"],
      "RETRIEVAL_QUERY",
    );
    expect(db.rpc).toHaveBeenCalledWith("match_chunks", {
      query_embedding: expect.any(Array),
      match_count: 5,
      min_similarity: 0.55,
    });
    expect(result.mode).toBe("vector");
    expect(result.sources).toEqual([
      {
        n: 1,
        chunkId: 11,
        title: "Buku Saku Tanggap Tangkas Tangguh",
        publisher: "BNPB",
        page: 23,
        url: "https://bnpb.go.id/buku-saku",
        content: chunkRow.content,
      },
    ]);
  });

  it("honours a custom k for the vector search", async () => {
    mockEmbed.mockResolvedValue([Array.from({ length: 768 }, () => 0.1)]);
    db.rpc.mockResolvedValue({ data: [], error: null });

    await retrieve("banjir rob", 3);

    expect(db.rpc).toHaveBeenCalledWith("match_chunks", {
      query_embedding: expect.any(Array),
      match_count: 3,
      min_similarity: 0.55,
    });
  });

  it("falls back to fts when embedding fails", async () => {
    mockEmbed.mockRejectedValue(new Error("RESOURCE_EXHAUSTED"));
    db.rpc.mockResolvedValue({
      data: [{ ...chunkRow, rank: 0.4 }],
      error: null,
    });

    const result = await retrieve("isi tas siaga");

    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith("search_chunks_fts", {
      q: "isi tas siaga",
      match_count: 5,
    });
    expect(result.mode).toBe("fts");
    expect(result.sources[0].chunkId).toBe(11);
  });

  it("returns mode none when both searches are empty", async () => {
    mockEmbed.mockRejectedValue(new Error("network error"));
    db.rpc.mockResolvedValue({ data: [], error: null });

    const result = await retrieve("presiden indonesia");

    expect(result).toEqual({ sources: [], mode: "none" });
  });

  it("falls back to fts when the vector search returns no rows", async () => {
    mockEmbed.mockResolvedValue([Array.from({ length: 768 }, () => 0.1)]);
    db.rpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [{ ...chunkRow, rank: 0.2 }],
        error: null,
      });

    const result = await retrieve("evakuasi banjir");

    expect(result.mode).toBe("fts");
    expect(result.sources).toHaveLength(1);
  });
});

const sources: Source[] = [
  {
    n: 1,
    chunkId: 1,
    title: "Buku Saku Tanggap Tangkas Tangguh",
    publisher: "BNPB",
    page: 23,
    url: "https://bnpb.go.id/buku-saku",
    content: "Isi tas siaga bencana.",
  },
  {
    n: 2,
    chunkId: 2,
    title: "Pedoman Kesiapsiagaan",
    publisher: "BPBD DKI Jakarta",
    page: null,
    url: "https://bpbd.jakarta.go.id/pedoman",
    content: "Kenali jalur evakuasi.",
  },
];

describe("buildContext", () => {
  it("numbers sources and includes the page when known", () => {
    const context = buildContext(sources);

    expect(context).toContain(
      "[1] (BNPB \u2014 Buku Saku Tanggap Tangkas Tangguh, hlm. 23)",
    );
    expect(context).toContain(
      "[2] (BPBD DKI Jakarta \u2014 Pedoman Kesiapsiagaan)",
    );
    expect(context).toContain("Isi tas siaga bencana.");
    expect(context.startsWith("<dokumen>")).toBe(true);
    expect(context.endsWith("</dokumen>")).toBe(true);
  });

  it("adds the area context only when provided", () => {
    const without = buildContext(sources);
    expect(without).not.toContain("<konteks_wilayah>");

    const withArea = buildContext(sources, {
      name: "Jatinegara",
      level: "Tinggi",
      score: 68,
    });
    expect(withArea).toContain(
      "<konteks_wilayah>Kecamatan Jatinegara, risiko hari ini: Tinggi (68/100)</konteks_wilayah>",
    );
  });
});
