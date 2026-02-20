import { supabase } from "@/integrations/supabase/client";
import { safeQuery } from "@/lib/supabase-debug";
import { SupabaseClient } from "@supabase/supabase-js";
import { 
  ListeningSessionStatus, 
  ListeningSession, 
  ListeningSessionTier, 
  ListeningPurchase, 
  AdminListeningSessionRow, 
  AdminListeningSessionInput, 
  AdminListeningTierInput,
  ExtendedDatabase
} from "@/types/listening-sessions";

// Helper to get around missing types for listening sessions tables
const db = supabase as unknown as SupabaseClient<ExtendedDatabase>;

export type { ListeningSessionStatus, ListeningSessionTier, ListeningSession, ListeningPurchase, AdminListeningSessionInput, AdminListeningTierInput, AdminListeningSessionRow };

export async function listOpenListeningSessions(signal?: AbortSignal): Promise<ListeningSession[]> {
  let sessionsQuery = db
    .from("listening_sessions")
    .select("id, title, description, scheduled_at, status")
    .eq("status", "open")
    .order("scheduled_at", { ascending: true });

  if (signal) {
    sessionsQuery = sessionsQuery.abortSignal(signal);
  }

  let tiersQuery = db
    .from("listening_session_tiers")
    .select("id, session_id, tier_name, price_cents, slot_limit, slots_filled, description, manually_closed")
    .order("price_cents", { ascending: true });

  if (signal) {
    tiersQuery = tiersQuery.abortSignal(signal);
  }

  const [sessionsData, tiersData] = await Promise.all([
    safeQuery(sessionsQuery),
    safeQuery(tiersQuery),
  ]);

  const sessions = (sessionsData || []) as Omit<ListeningSession, "tiers">[];
  const tiers = (tiersData || []) as ListeningSessionTier[];

  const tierBySession = new Map<string, ListeningSessionTier[]>();

  for (const tier of tiers) {
    const remaining = Math.max(0, Number(tier.slot_limit) - Number(tier.slots_filled));
    const computedTier: ListeningSessionTier = {
      ...tier,
      remaining_slots: remaining,
      sold_out: Boolean(tier.manually_closed) || remaining === 0,
    };

    const existing = tierBySession.get(tier.session_id) || [];
    existing.push(computedTier);
    tierBySession.set(tier.session_id, existing);
  }

  return sessions.map((session) => ({
    ...session,
    tiers: tierBySession.get(session.id) || [],
  }));
}

export async function listMyListeningPurchases(signal?: AbortSignal): Promise<ListeningPurchase[]> {
  let query = db
    .from("listening_session_purchases")
    .select("id, session_id, tier_id, status, payment_id, created_at, paid_at, stripe_session_id")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const data = await safeQuery(query);
  return (data || []) as ListeningPurchase[];
}

export async function findPaidPurchaseForTier(
  sessionId: string,
  tierId: string,
  stripeSessionId?: string | null,
  signal?: AbortSignal
): Promise<ListeningPurchase | null> {
  let query = db
    .from("listening_session_purchases")
    .select("id, session_id, tier_id, status, payment_id, created_at, paid_at, stripe_session_id")
    .eq("session_id", sessionId)
    .eq("tier_id", tierId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1);

  if (stripeSessionId) {
    query = query.eq("stripe_session_id", stripeSessionId);
  }

  if (signal) {
    query = query.abortSignal(signal);
  }

  const data = await safeQuery(query);
  return ((data || [])[0] as ListeningPurchase | undefined) || null;
}

export async function createListeningSubmission(
  purchaseId: string,
  trackTitle: string,
  trackUrl: string
): Promise<string> {
  const { data, error } = await db.rpc("create_listening_submission", {
    p_purchase_id: purchaseId,
    p_track_title: trackTitle,
    p_track_url: trackUrl,
  });

  if (error) throw error;
  return data as string;
}

export async function listAdminListeningSessions(signal?: AbortSignal): Promise<AdminListeningSessionRow[]> {
  let sessionsQuery = db
    .from("listening_sessions")
    .select("id, title, description, scheduled_at, status, created_by, created_at, updated_at")
    .order("scheduled_at", { ascending: true });

  if (signal) {
    sessionsQuery = sessionsQuery.abortSignal(signal);
  }

  let tiersQuery = db
    .from("listening_session_tiers")
    .select("id, session_id, tier_name, price_cents, slot_limit, slots_filled, description, manually_closed")
    .order("price_cents", { ascending: true });

  if (signal) {
    tiersQuery = tiersQuery.abortSignal(signal);
  }

  const [sessionsData, tiersData] = await Promise.all([
    safeQuery(sessionsQuery),
    safeQuery(tiersQuery),
  ]);

  const sessions = (sessionsData || []) as unknown as Omit<AdminListeningSessionRow, "tiers">[];
  const tiers = (tiersData || []) as unknown as ListeningSessionTier[];

  const tierBySession = new Map<string, ListeningSessionTier[]>();
  // Use unknown cast first to avoid type mismatch
  for (const rawTier of tiers) {
    const tier = rawTier;
    const remaining = Math.max(0, Number(tier.slot_limit) - Number(tier.slots_filled));
    const computedTier: ListeningSessionTier = {
      ...tier,
      remaining_slots: remaining,
      sold_out: Boolean(tier.manually_closed) || remaining === 0,
    };
    const existing = tierBySession.get(tier.session_id) || [];
    existing.push(computedTier);
    tierBySession.set(tier.session_id, existing);
  }

  return sessions.map((session) => ({
    ...session,
    tiers: tierBySession.get(session.id) || [],
  }));
}

export async function upsertListeningSessionWithTiers(
  payload: AdminListeningSessionInput,
  tiers: AdminListeningTierInput[],
  currentUserId: string
): Promise<string> {
  const sessionPayload = {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    scheduled_at: payload.scheduled_at,
    status: payload.status,
    created_by: currentUserId,
  };

  let sessionId = payload.id;

  if (sessionId) {
    const { error } = await db
      .from("listening_sessions")
      .update(sessionPayload)
      .eq("id", sessionId);
    if (error) throw error;
  } else {
    const { data, error } = await db
      .from("listening_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();
    if (error) throw error;
    sessionId = data.id as string;
  }

  if (!sessionId) throw new Error("Unable to resolve session id");

  const { data: existingTiers, error: existingError } = await db
    .from("listening_session_tiers")
    .select("id, slots_filled")
    .eq("session_id", sessionId);
  if (existingError) throw existingError;

  const existingById = new Map<string, { id: string; slots_filled: number }>();
  (existingTiers || []).forEach((t: { id: string; slots_filled: number }) => existingById.set(t.id, t));

  for (const tier of tiers) {
    const cleanedLimit = Math.max(1, Number(tier.slot_limit || 1));
    const existing = tier.id ? existingById.get(tier.id) : null;
    if (existing && cleanedLimit < Number(existing.slots_filled || 0)) {
      throw new Error(`${tier.tier_name}: slot limit cannot be below slots filled (${existing.slots_filled})`);
    }
  }

  const toUpsert = tiers.map((tier) => ({
    id: tier.id || undefined,
    session_id: sessionId,
    tier_name: tier.tier_name.trim(),
    price_cents: Math.max(0, Number(tier.price_cents || 0)),
    slot_limit: Math.max(1, Number(tier.slot_limit || 1)),
    description: tier.description?.trim() || null,
    manually_closed: Boolean(tier.manually_closed),
  }));

  if (toUpsert.length > 0) {
    const { error } = await db
      .from("listening_session_tiers")
      .upsert(toUpsert);
    if (error) throw error;
  }

  const incomingIds = new Set(toUpsert.map((t) => t.id).filter(Boolean) as string[]);
  const removableIds = (existingTiers || [])
    .map((t: { id: string }) => t.id)
    .filter((id: string) => !incomingIds.has(id));

  if (removableIds.length > 0) {
    const { data: usedTiers, error: usedError } = await db
      .from("listening_session_purchases")
      .select("tier_id")
      .in("tier_id", removableIds)
      .limit(1);
    if (usedError) throw usedError;

    if ((usedTiers || []).length > 0) {
      throw new Error("Cannot remove tiers that already have purchases");
    }

    const { error: deleteError } = await db
      .from("listening_session_tiers")
      .delete()
      .in("id", removableIds);
    if (deleteError) throw deleteError;
  }

  return sessionId;
}
