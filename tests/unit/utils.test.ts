import { describe, expect, it } from "vitest";
import { cn, getYouTubeId } from "@/lib/utils";

describe("utils", () => {
  it("merges class names without duplication", () => {
    expect(cn("bg-red-500", "bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("extracts YouTube IDs from URLs or returns the ID directly", () => {
    expect(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeId(null)).toBe("");
  });
});
