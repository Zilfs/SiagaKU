/**
 * Offline ingest for the RAG guideline corpus.
 *
 *   npx tsx scripts/ingest-guidelines.ts
 *
 * Reads `data/pedoman/index.json`, extracts every PDF page with unpdf, splits
 * the text into chunks, embeds them with Gemini in batches of 20, and upserts
 * the result into `documents` + `document_chunks`. Re-running is safe: the
 * chunks of a document are replaced.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";
import { env } from "../src/lib/env";
import { chunkPages } from "../src/lib/rag/chunk";
import { EMBEDDING_DIMENSIONS, embedTexts } from "../src/lib/rag/embed";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the ambient environment.
}

type IndexEntry = {
  file: string;
  title: string;
  publisher: string;
  year?: number;
  url: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "pedoman");
const INDEX_PATH = path.join(DATA_DIR, "index.json");
const EMBED_BATCH = 20;
const INSERT_BATCH = 50;
const BATCH_DELAY_MS = 1000;

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Drops running headers/footers and bare page numbers. A line counts as a
 * header/footer when it appears in the first or last two lines of at least
 * half of the pages.
 */
function cleanPages(texts: string[]): string[] {
  const counts = new Map<string, number>();

  if (texts.length >= 4) {
    for (const text of texts) {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const edges = new Set([...lines.slice(0, 2), ...lines.slice(-2)]);
      for (const line of edges) {
        if (line.length <= 120) counts.set(line, (counts.get(line) ?? 0) + 1);
      }
    }
  }

  const threshold = Math.ceil(texts.length * 0.5);
  const repeated = new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([line]) => line),
  );

  return texts.map((text) =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 && !repeated.has(line) && !/^\d{1,4}$/.test(line),
      )
      .join("\n"),
  );
}

async function embedAll(texts: string[]): Promise<(number[] | null)[]> {
  const vectors: (number[] | null)[] = [];

  for (let start = 0; start < texts.length; start += EMBED_BATCH) {
    const batch = texts.slice(start, start + EMBED_BATCH);
    let batchVectors: number[][] | null = null;

    for (let attempt = 0; attempt < 2 && batchVectors === null; attempt += 1) {
      try {
        batchVectors = await embedTexts(batch, "RETRIEVAL_DOCUMENT");
      } catch (error) {
        console.warn(
          `  embedding batch ${start / EMBED_BATCH + 1} failed (attempt ${attempt + 1}):`,
          error instanceof Error ? error.message : error,
        );
        if (attempt === 0) await sleep(BATCH_DELAY_MS * 2);
      }
    }

    if (batchVectors === null) {
      console.warn("  storing this batch without embeddings; FTS still works");
      vectors.push(...batch.map(() => null));
    } else {
      for (const vector of batchVectors) {
        if (vector.length !== EMBEDDING_DIMENSIONS) {
          console.warn(
            `  expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector.length}`,
          );
        }
        vectors.push(vector);
      }
    }

    if (start + EMBED_BATCH < texts.length) await sleep(BATCH_DELAY_MS);
  }

  return vectors;
}

async function upsertDocument(entry: IndexEntry): Promise<number> {
  const { data: existing, error: lookupError } = await supabase
    .from("documents")
    .select("id")
    .eq("url", entry.url)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) {
    const { error } = await supabase
      .from("documents")
      .update({
        title: entry.title,
        publisher: entry.publisher,
        year: entry.year ?? null,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing.id as number;
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: entry.title,
      publisher: entry.publisher,
      year: entry.year ?? null,
      url: entry.url,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as number;
}

async function ingest(entry: IndexEntry) {
  const pdfPath = path.join(DATA_DIR, entry.file);
  const buffer = await readFile(pdfPath);
  const extracted = await extractText(new Uint8Array(buffer), {
    mergePages: false,
  });

  const pages = cleanPages(extracted.text)
    .map((text, index) => ({ page: index + 1, text }))
    .filter((page) => page.text.length > 0);

  const chunks = chunkPages(pages);
  if (chunks.length === 0) {
    console.warn(`  no text extracted from ${entry.file}`);
    return { chunks: 0, lengths: [] as number[] };
  }

  const vectors = await embedAll(chunks.map((chunk) => chunk.content));
  const documentId = await upsertDocument(entry);

  const { error: deleteError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId);
  if (deleteError) throw new Error(deleteError.message);

  for (let start = 0; start < chunks.length; start += INSERT_BATCH) {
    const rows = chunks
      .slice(start, start + INSERT_BATCH)
      .map((chunk, offset) => {
        const vector = vectors[start + offset];
        return {
          document_id: documentId,
          position: chunk.position,
          page: chunk.page,
          section_title: chunk.sectionTitle,
          content: chunk.content,
          embedding: vector ?? null,
        };
      });

    const { error } = await supabase.from("document_chunks").insert(rows);
    if (error) throw new Error(error.message);
  }

  return {
    chunks: chunks.length,
    lengths: chunks.map((chunk) => chunk.content.length),
  };
}

async function main() {
  const raw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(raw) as IndexEntry[];

  if (!Array.isArray(index) || index.length === 0) {
    console.error(
      `No documents listed in ${INDEX_PATH}. Add PDFs to data/pedoman/ and list them in index.json first.`,
    );
    process.exitCode = 1;
    return;
  }

  let totalChunks = 0;
  let failed = 0;
  const allLengths: number[] = [];

  for (const entry of index) {
    console.log(`Ingesting ${entry.file} (${entry.publisher})...`);
    try {
      const result = await ingest(entry);
      totalChunks += result.chunks;
      allLengths.push(...result.lengths);
      console.log(`  ${result.chunks} chunks`);
    } catch (error) {
      failed += 1;
      console.error(
        `  failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const longest = allLengths.length > 0 ? Math.max(...allLengths) : 0;
  const shortest = allLengths.length > 0 ? Math.min(...allLengths) : 0;

  console.log("");
  console.log("Summary");
  console.log(`  documents: ${index.length - failed}/${index.length}`);
  console.log(`  chunks:    ${totalChunks}`);
  console.log(`  longest:   ${longest} chars`);
  console.log(`  shortest:  ${shortest} chars`);

  if (index.length < 5) {
    console.warn("  warning: the plan asks for at least 5 guideline documents");
  }
  if (totalChunks < 150) {
    console.warn("  warning: the plan asks for at least 150 chunks");
  }

  if (failed > 0) process.exitCode = 1;
}

await main();
