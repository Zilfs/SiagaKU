import { describe, expect, it } from "vitest";
import { extractChatText } from "../../scripts/lib/smoke";

describe("extractChatText", () => {
  it("joins text-delta parts and ignores other parts and [DONE]", () => {
    const body = [
      'data: {"type":"start"}',
      "",
      'data: {"type":"text-start","id":"t"}',
      'data: {"type":"text-delta","id":"t","delta":"Siapkan "}',
      'data: {"type":"text-delta","id":"t","delta":"tas siaga."}',
      'data: {"type":"data-emergency","data":{"active":true}}',
      "data: [DONE]",
    ].join("\n");
    expect(extractChatText(body)).toBe("Siapkan tas siaga.");
  });

  it("returns an empty string when there is no text or the JSON is bad", () => {
    expect(extractChatText('data: {"type":"start"}\ndata: {oops')).toBe("");
  });
});
