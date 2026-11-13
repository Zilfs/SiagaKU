import { describe, expect, it } from "vitest";
import { chunkPages } from "@/features/chat/server/rag/chunk";

const paragraph = (n: number) =>
  `Paragraf ${n}. Warga perlu menyiapkan tas siaga bencana berisi air minum, makanan ringan, obat-obatan, lampu senter, dan dokumen penting. Simpan tas di tempat yang mudah dijangkau saat banjir datang.`;

describe("chunkPages", () => {
  it("keeps every chunk within targetChars + 500", () => {
    const pages = [
      {
        page: 1,
        text: Array.from({ length: 12 }, (_, i) => paragraph(i + 1)).join(
          "\n\n",
        ),
      },
    ];

    const chunks = chunkPages(pages, { targetChars: 400, overlapChars: 60 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(900);
    }
  });

  it("overlaps the tail of a chunk with the next chunk", () => {
    const pages = [
      {
        page: 2,
        text: Array.from({ length: 8 }, (_, i) => paragraph(i + 1)).join(
          "\n\n",
        ),
      },
    ];

    const chunks = chunkPages(pages, { targetChars: 400, overlapChars: 80 });
    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 1; i < chunks.length; i += 1) {
      const previousTail = chunks[i - 1].content.slice(-20).trim();
      expect(chunks[i].content).toContain(previousTail);
    }
  });

  it("carries the page number into every chunk", () => {
    const chunks = chunkPages([
      { page: 3, text: paragraph(1) },
      { page: 4, text: paragraph(2) },
    ]);

    expect(chunks.map((c) => c.page)).toEqual([3, 4]);
  });

  it("does not split a paragraph shorter than the target", () => {
    const text = paragraph(1);
    const chunks = chunkPages([{ page: 5, text }]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
  });

  it("uses a short line without a trailing period as the section title", () => {
    const chunks = chunkPages([
      {
        page: 1,
        text: ["TAS SIAGA BENCANA", paragraph(1)].join("\n\n"),
      },
    ]);

    expect(chunks[0].sectionTitle).toBe("TAS SIAGA BENCANA");
  });

  it("splits an oversized paragraph at sentence boundaries", () => {
    const sentence =
      "Siapkan air minum dan makanan ringan di dalam tas siaga bencana keluarga. ";
    const chunks = chunkPages([{ page: 7, text: sentence.repeat(12).trim() }], {
      targetChars: 200,
      overlapChars: 40,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(700);
    }
    expect(chunks[0].content.endsWith(".")).toBe(true);
  });

  it("numbers chunks consecutively from zero", () => {
    const chunks = chunkPages([
      {
        page: 1,
        text: Array.from({ length: 6 }, (_, i) => paragraph(i + 1)).join(
          "\n\n",
        ),
      },
    ]);

    expect(chunks.map((c) => c.position)).toEqual(chunks.map((_, i) => i));
  });
});
