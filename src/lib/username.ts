export const USERNAME_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): { valid: boolean; message?: string } {
  const username = value.trim();

  if (!username) {
    return { valid: false, message: "Username is required." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      message: "Use 3-30 characters: letters, numbers, ., _, -. Start/end with a letter or number.",
    };
  }

  return { valid: true };
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getUsernameCooldownRemainingMs(lastChangedAt: string | null, now = Date.now()): number {
  if (!lastChangedAt) return 0;

  const changedAtMs = new Date(lastChangedAt).getTime();
  if (Number.isNaN(changedAtMs)) return 0;

  const elapsed = now - changedAtMs;
  if (elapsed >= THIRTY_DAYS_MS) return 0;

  return THIRTY_DAYS_MS - elapsed;
}

export function formatDurationDaysHours(ms: number): string {
  if (ms <= 0) return "0d 0h";

  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return `${days}d ${hours}h`;
}
