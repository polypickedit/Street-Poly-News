import { describe, expect, it } from "vitest";
import {
  USERNAME_REGEX,
  formatDurationDaysHours,
  getUsernameCooldownRemainingMs,
  normalizeUsername,
  validateUsername,
} from "@/lib/username";

describe("username utils", () => {
  it("normalizes username to lowercase trimmed value", () => {
    expect(normalizeUsername("  MiXed.Name_1  ")).toBe("mixed.name_1");
  });

  it("accepts valid usernames", () => {
    expect(USERNAME_REGEX.test("abc")).toBe(true);
    expect(USERNAME_REGEX.test("artist.name_1-2")).toBe(true);
    expect(validateUsername("artist-name").valid).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(USERNAME_REGEX.test("ab")).toBe(false);
    expect(USERNAME_REGEX.test("_artist")).toBe(false);
    expect(USERNAME_REGEX.test("artist_ ")).toBe(false);
    expect(validateUsername("artist🙂").valid).toBe(false);
  });

  it("returns remaining cooldown milliseconds", () => {
    const now = new Date("2026-02-17T00:00:00.000Z").getTime();
    const lastChangedAt = "2026-02-10T00:00:00.000Z";

    const remaining = getUsernameCooldownRemainingMs(lastChangedAt, now);
    expect(remaining).toBe(23 * 24 * 60 * 60 * 1000);
  });

  it("returns zero cooldown after 30 days", () => {
    const now = new Date("2026-02-17T00:00:00.000Z").getTime();
    const lastChangedAt = "2026-01-10T00:00:00.000Z";

    expect(getUsernameCooldownRemainingMs(lastChangedAt, now)).toBe(0);
  });

  it("formats cooldown duration", () => {
    expect(formatDurationDaysHours(0)).toBe("0d 0h");
    expect(formatDurationDaysHours(25 * 60 * 60 * 1000)).toBe("1d 1h");
  });
});
