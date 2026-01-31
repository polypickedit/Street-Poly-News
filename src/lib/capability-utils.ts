export interface RawCapability {
  capability: string;
  expires_at: string | null;
}

/**
 * Filters capabilities based on their expiration date.
 * If expires_at is null, it's considered a permanent capability.
 */
export function filterActiveCapabilities(capabilities: RawCapability[]): RawCapability[] {
  const now = new Date();
  return capabilities.filter((cap) => {
    if (!cap.expires_at) return true;
    return new Date(cap.expires_at) > now;
  });
}
