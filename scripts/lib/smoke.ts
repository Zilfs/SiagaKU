/** Joins the `delta` of every text-delta part in an AI SDK UI message stream (SSE). */
export function extractChatText(body: string): string {
  let text = "";
  for (const line of body.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const part = JSON.parse(line.slice(5).trim());
      if (part.type === "text-delta" && typeof part.delta === "string") {
        text += part.delta;
      }
    } catch {
      // Non-JSON line such as [DONE].
    }
  }
  return text;
}
