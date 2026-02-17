import { supabase } from "@/integrations/supabase/client";

export type ListeningSessionStatus = "draft" | "open" | "closed" | "completed";

export interface ListeningSessionTier {
  id: string;
  session_id: string;
  tier_name: string;
  price_cents: number;
  slot_limit: number;
  slots_filled: number;
  description: string | null;
  manually_closed: boolean;
  remaining_slots: number;
  sold_out: boolean;
}

export interface ListeningSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: ListeningSessionStatus;
  tiers: ListeningSessionTier[];
}

export interface ListeningPurchase {
  id: string;
  session_id: string;
  tier_id: string;
  status: "pending" | "paid" | "refunded" | "failed";
  payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  stripe_session_id?: string | null;
}

export interface AdminListeningSessionInput {
  id?: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  status: ListeningSessionStatus;
}

export interface AdminListeningTierInput {
  id?: string;
  tier_name: string;
  price_cents: number;
  slot_limit: number;
  description?: string | null;
  manually_closed?: boolean;
}

export interface AdminListeningSessionRow extends AdminListeningSessionInput {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tiers: ListeningSessionTier[];
}

export async function listOpenListeningSessions(): Promise<ListeningSession[]> {
  const sessionsQuery = (supabase as any)
    .from("listening_sessions")
    .select("id, title, description, scheduled_at, status")
    .eq("status", "open")
    .order("scheduled_at", { ascending: true });

  const tiersQuery = (supabase as any)
    .from("listening_session_tiers")
    .select("id, session_id, tier_name, price_cents, slot_limit, slots_filled, description, manually_closed")
    .order("price_cents", { ascending: true });

  const [{ data: sessions, error: sessionsError }, { data: tiers, error: tiersError }] = await Promise.all([
    sessionsQuery,
    tiersQuery,
  ]);

  if (sessionsError) throw sessionsError;
  if (tiersError) throw tiersError;

  const tierBySession = new Map<string, ListeningSessionTier[]>();

  for (const rawTier of (tiers || [])) {
    const tier = rawTier as ListeningSessionTier;
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

  return ((sessions || []) as Omit<ListeningSession, "tiers">[]).map((session) => ({
    ...session,
    tiers: tierBySession.get(session.id) || [],
  }));
}

export async function listMyListeningPurchases(): Promise<ListeningPurchase[]> {
  const { data, error } = await (supabase as any)
    .from("listening_session_purchases")
    .select("id, session_id, tier_id, status, payment_id, created_at, paid_at, stripe_session_id")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ListeningPurchase[];
}

export async function findPaidPurchaseForTier(
  sessionId: string,
  tierId: string,
  stripeSessionId?: string | null
): Promise<ListeningPurchase | null> {
  const baseQuery = (supabase as any)
    .from("listening_session_purchases")
    .select("id, session_id, tier_id, status, payment_id, created_at, paid_at, stripe_session_id")
    .eq("session_id", sessionId)
    .eq("tier_id", tierId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1);

  const { data, error } = stripeSessionId
    ? await baseQuery.eq("stripe_session_id", stripeSessionId)
    : await baseQuery;

  if (error) throw error;
  return ((data || [])[0] as ListeningPurchase | undefined) || null;
}

export async function createListeningSubmission(
  purchaseId: string,
  trackTitle: string,
  trackUrl: string
): Promise<string> {
  const { data, error } = await supabase.rpc("create_listening_submission", {
    p_purchase_id: purchaseId,
    p_track_title: trackTitle,
    p_track_url: trackUrl,
  });

  if (error) throw error;
  return data as string;
}

export async function listAdminListeningSessions(): Promise<AdminListeningSessionRow[]> {
  const sessionsQuery = (supabase as any)
    .from("listening_sessions")
    .select("id, title, description, scheduled_at, status, created_by, created_at, updated_at")
    .order("scheduled_at", { ascending: true });

  const tiersQuery = (supabase as any)
    .from("listening_session_tiers")
    .select("id, session_id, tier_name, price_cents, slot_limit, slots_filled, description, manually_closed")
    .order("price_cents", { ascending: true });

  const [{ data: sessions, error: sessionsError }, { data: tiers, error: tiersError }] = await Promise.all([
    sessionsQuery,
    tiersQuery,
  ]);

  if (sessionsError) throw sessionsError;
  if (tiersError) throw tiersError;

  const tierBySession = new Map<string, ListeningSessionTier[]>();
  for (const rawTier of (tiers || [])) {
    const tier = rawTier as ListeningSessionTier;
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

  return ((sessions || []) as Omit<AdminListeningSessionRow, "tiers">[]).map((session) => ({
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
    const { error } = await (supabase as any)
      .from("listening_sessions")
      .update(sessionPayload)
      .eq("id", sessionId);
    if (error) throw error;
  } else {
    const { data, error } = await (supabase as any)
      .from("listening_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();
    if (error) throw error;
    sessionId = data.id as string;
  }

  if (!sessionId) throw new Error("Unable to resolve session id");

  const { data: existingTiers, error: existingError } = await (supabase as any)
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
    const { error } = await (supabase as any)
      .from("listening_session_tiers")
      .upsert(toUpsert);
    if (error) throw error;
  }

  const incomingIds = new Set(toUpsert.map((t) => t.id).filter(Boolean) as string[]);
  const removableIds = (existingTiers || [])
    .map((t: { id: string }) => t.id)
    .filter((id: string) => !incomingIds.has(id));

  if (removableIds.length > 0) {
    const { data: usedTiers, error: usedError } = await (supabase as any)
      .from("listening_session_purchases")
      .select("tier_id")
      .in("tier_id", removableIds)
      .limit(1);
    if (usedError) throw usedError;

    if ((usedTiers || []).length > 0) {
      throw new Error("Cannot remove tiers that already have purchases");
    }

    const { error: deleteError } = await (supabase as any)
      .from("listening_session_tiers")
      .delete()
      .in("id", removableIds);
    if (deleteError) throw deleteError;
  }

  return sessionId;
}
