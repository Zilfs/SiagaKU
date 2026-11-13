export type Page = {
  page: number;
  text: string;
};

export type Chunk = {
  /** Zero-based order of the chunk inside its document. */
  position: number;
  page: number | null;
  sectionTitle: string | null;
  content: string;
};

export type ChunkOptions = {
  /** Soft upper bound for a chunk, in characters. */
  targetChars?: number;
  /** Characters repeated from the end of one chunk into the next. */
  overlapChars?: number;
};

const DEFAULT_TARGET_CHARS = 3000;
const DEFAULT_OVERLAP_CHARS = 300;

type Block = {
  text: string;
  page: number;
  heading: boolean;
};

const HEADING_MAX_CHARS = 80;
const HEADING_MAX_WORDS = 12;

/**
 * A heading is a short line that does not end a sentence, e.g.
 * "TAS SIAGA BENCANA" or "3. Sebelum banjir".
 */
function isHeading(line: string): boolean {
  const text = line.trim();
  if (text.length === 0 || text.length > HEADING_MAX_CHARS) return false;
  if (/[.!?,;:]$/.test(text)) return false;
  return text.split(/\s+/).length <= HEADING_MAX_WORDS;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Splits one extracted page into paragraphs. Standalone short lines become
 * heading blocks so the nearest heading can be stored as section_title.
 */
function toBlocks(page: Page): Block[] {
  const text = normalize(page.text);
  if (!text) return [];

  const blocks: Block[] = [];

  for (const raw of text.split(/\n\s*\n/)) {
    const paragraph = raw.trim();
    if (!paragraph) continue;

    const lines = paragraph
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 1) {
      blocks.push({
        text: paragraph,
        page: page.page,
        heading: isHeading(paragraph),
      });
      continue;
    }

    let run: string[] = [];
    for (const line of lines) {
      if (isHeading(line)) {
        if (run.length > 0) {
          blocks.push({ text: run.join(" "), page: page.page, heading: false });
          run = [];
        }
        blocks.push({ text: line, page: page.page, heading: true });
      } else {
        run.push(line);
      }
    }
    if (run.length > 0) {
      blocks.push({ text: run.join(" "), page: page.page, heading: false });
    }
  }

  return blocks;
}

/**
 * Cuts an oversized paragraph at the last sentence end before the target,
 * then at a word boundary, then hard at the target.
 */
function splitOversized(text: string, targetChars: number): string[] {
  const pieces: string[] = [];
  let rest = text.trim();

  while (rest.length > targetChars) {
    const window = rest.slice(0, targetChars + 1);

    let cut = -1;
    const sentenceEnd = /[.!?]["')\]]?\s/g;
    let match: RegExpExecArray | null;
    while ((match = sentenceEnd.exec(window)) !== null) {
      cut = match.index + match[0].length;
    }

    if (cut < targetChars * 0.3) {
      const space = window.lastIndexOf(" ");
      cut = space > targetChars * 0.3 ? space + 1 : targetChars;
    }

    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) pieces.push(rest);
  return pieces;
}

/** Prefers the end of a word so the overlap does not start mid-word. */
function overlapTail(text: string, overlapChars: number): string {
  if (overlapChars <= 0) return "";
  const trimmed = text.trim();
  if (trimmed.length <= overlapChars) return "";

  let tail = trimmed.slice(-overlapChars);
  const firstSpace = tail.search(/\s/);
  if (firstSpace > 0 && firstSpace < 40) tail = tail.slice(firstSpace + 1);
  return tail.trim();
}

/**
 * Splits extracted pages into chunks of roughly targetChars, cutting on
 * paragraph boundaries and repeating overlapChars into the next chunk.
 */
export function chunkPages(pages: Page[], opts: ChunkOptions = {}): Chunk[] {
  const targetChars = opts.targetChars ?? DEFAULT_TARGET_CHARS;
  const overlapChars = opts.overlapChars ?? DEFAULT_OVERLAP_CHARS;

  const chunks: Chunk[] = [];
  let buffer = "";
  let bufferPage: number | null = null;
  let bufferSection: string | null = null;
  let sectionTitle: string | null = null;

  const flush = () => {
    const content = buffer.trim();
    if (!content) {
      buffer = "";
      bufferPage = null;
      return;
    }
    chunks.push({
      position: chunks.length,
      page: bufferPage,
      sectionTitle: bufferSection,
      content,
    });
    buffer = "";
    bufferPage = null;
  };

  const startBuffer = (text: string, page: number) => {
    buffer = text;
    bufferPage = page;
    bufferSection = sectionTitle;
  };

  for (const page of pages) {
    for (const block of toBlocks(page)) {
      if (block.heading) sectionTitle = block.text;

      if (buffer && bufferPage !== page.page) {
        const previous = buffer;
        flush();
        startBuffer(overlapTail(previous, overlapChars), page.page);
      }

      const pieces =
        block.text.length > targetChars
          ? splitOversized(block.text, targetChars)
          : [block.text];

      for (const piece of pieces) {
        if (!buffer) {
          startBuffer(piece, page.page);
          continue;
        }

        if (buffer.length + 2 + piece.length <= targetChars) {
          buffer += `\n\n${piece}`;
          continue;
        }

        const previous = buffer;
        flush();

        const tail = overlapTail(previous, overlapChars);
        const withTail =
          tail && tail.length + 2 + piece.length <= targetChars + 500
            ? `${tail}\n\n${piece}`
            : piece;

        startBuffer(withTail, page.page);
      }
    }
  }

  flush();
  return chunks;
}
