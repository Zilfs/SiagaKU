export type ChatSource = {
  n: number;
  title: string;
  publisher?: string;
  page?: number | null;
  url?: string;
};

/** The source objects may arrive with Indonesian keys from older drafts; normalise both. */
export function normaliseSources(
  raw: Array<Record<string, unknown>> | undefined,
): ChatSource[] {
  if (!raw?.length) return [];
  return raw.map((item, index) => ({
    n: Number(item.n ?? index + 1),
    title: String(item.title ?? item.judul ?? "Sumber"),
    publisher:
      item.publisher != null
        ? String(item.publisher)
        : item.penerbit != null
          ? String(item.penerbit)
          : undefined,
    page:
      item.page != null
        ? Number(item.page)
        : item.halaman != null
          ? Number(item.halaman)
          : null,
    url: item.url != null ? String(item.url) : undefined,
  }));
}

/** Numbered citations under an answer; each [n] in the text links here. */
export function SourceList({ sources }: { sources: ChatSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="sk-sources">
      <p className="sk-sources__title">Sumber</p>
      <ol>
        {sources.map((source) => (
          <li key={`${source.n}-${source.title}`} id={`sumber-${source.n}`}>
            <span className="sk-mono">[{source.n}]</span>{" "}
            <span>{source.title}</span>
            {source.publisher ? (
              <span className="sk-sources__meta">
                {source.publisher}
                {source.page != null ? ` · hlm. ${source.page}` : ""}
              </span>
            ) : null}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                Buka
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
