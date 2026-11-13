import "server-only";
import { supabaseServer } from "@/lib/db/client";
import { embedTexts } from "./embed";

export type Source = {
  /** 1-based citation number used by the model and the UI. */
  n: number;
  chunkId: number;
  title: string;
  publisher: string;
  page: number | null;
  url: string;
  content: string;
};

export type RetrievalMode = "vector" | "fts" | "none";

export type RetrievalResult = {
  sources: Source[];
  mode: RetrievalMode;
};

export type AreaContext = {
  name: string;
  /** Display label, e.g. "Tinggi". */
  level: string;
  score: number;
};

const DEFAULT_K = 5;
const MIN_SIMILARITY = 0.55;

type ChunkRow = {
  id: number;
  document_id: number;
  content: string;
  page: number | null;
  section_title: string | null;
};

type DocumentRow = {
  id: number;
  title: string;
  publisher: string;
  url: string;
};

async function toSources(rows: ChunkRow[]): Promise<Source[]> {
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((row) => row.document_id))];
  const { data, error } = await supabaseServer()
    .from("documents")
    .select("id, title, publisher, url")
    .in("id", ids);

  if (error) throw new Error(`documents lookup failed: ${error.message}`);

  const documents = new Map(
    ((data ?? []) as DocumentRow[]).map((doc) => [doc.id, doc]),
  );

  return rows.map((row, index) => {
    const doc = documents.get(row.document_id);
    return {
      n: index + 1,
      chunkId: row.id,
      title: doc?.title ?? "",
      publisher: doc?.publisher ?? "",
      page: row.page,
      url: doc?.url ?? "",
      content: row.content,
    };
  });
}

async function vectorSearch(query: string, k: number): Promise<ChunkRow[]> {
  const [embedding] = await embedTexts([query], "RETRIEVAL_QUERY");
  if (!embedding || embedding.length === 0) {
    throw new Error("empty query embedding");
  }

  const { data, error } = await supabaseServer().rpc("match_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_count: k,
    min_similarity: MIN_SIMILARITY,
  });

  if (error) throw new Error(`match_chunks failed: ${error.message}`);
  return (data ?? []) as ChunkRow[];
}

async function ftsSearch(query: string, k: number): Promise<ChunkRow[]> {
  const { data, error } = await supabaseServer().rpc("search_chunks_fts", {
    q: query,
    match_count: k,
  });

  if (error) throw new Error(`search_chunks_fts failed: ${error.message}`);
  return (data ?? []) as ChunkRow[];
}

/**
 * Finds the guideline chunks most relevant to the query. Falls back to
 * Postgres full-text search when the embedding call or vector search fails,
 * so the chat keeps working while Gemini is rate limited.
 */
export async function retrieve(
  query: string,
  k: number = DEFAULT_K,
): Promise<RetrievalResult> {
  const trimmed = query.trim();
  if (!trimmed) return { sources: [], mode: "none" };

  try {
    const rows = await vectorSearch(trimmed, k);
    if (rows.length > 0) {
      return { sources: await toSources(rows), mode: "vector" };
    }
  } catch (error) {
    console.warn("vector retrieval failed, falling back to fts:", error);
  }

  let rows: ChunkRow[] = [];
  try {
    rows = await ftsSearch(trimmed, k);
  } catch (error) {
    console.warn("fts retrieval failed:", error);
  }

  if (rows.length === 0) return { sources: [], mode: "none" };
  return { sources: await toSources(rows), mode: "fts" };
}

/**
 * Builds the `<dokumen>` block described in docs/05 Desain AI §3.3. The
 * optional area line tells the model which district the answer is for.
 */
export function buildContext(sources: Source[], area?: AreaContext): string {
  const lines = ["<dokumen>"];

  for (const source of sources) {
    const page = source.page === null ? "" : `, hlm. ${source.page}`;
    lines.push(
      `[${source.n}] (${source.publisher} \u2014 ${source.title}${page})`,
    );
    lines.push(source.content);
  }

  lines.push("</dokumen>");

  if (area) {
    lines.push(
      `<konteks_wilayah>Kecamatan ${area.name}, risiko hari ini: ${area.level} (${area.score}/100)</konteks_wilayah>`,
    );
  }

  return lines.join("\n");
}
