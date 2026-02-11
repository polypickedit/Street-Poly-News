import { supabase } from "@/integrations/supabase/client";
import { createSlotCheckoutSession } from "./stripe";

export interface SubmissionPayload {
  artist_name: string;
  track_title: string;
  slot_id: string;
  slot_slug: string;
  description: string;
  links: string[];
  preferred_date: string;
  submission_type: "music" | "story" | "announcement";
  distribution_targets: string[];
  media_urls?: string[];
}

export const submissionService = {
  async createWithStripe(payload: SubmissionPayload, userId: string) {
    // 1. Insert pending submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        user_id: userId,
        slot_id: payload.slot_id,
        track_title: payload.track_title,
        artist_name: payload.artist_name,
        status: "pending",
        payment_status: "unpaid",
        payment_type: "stripe",
        submission_type: payload.submission_type,
        distribution_targets: payload.distribution_targets,
        content_bundle: {
          artist_name: payload.artist_name,
          title: payload.track_title,
          description: payload.description,
          links: payload.links,
          preferred_date: payload.preferred_date,
          media_urls: payload.media_urls || []
        },
        notes_internal: `Links: ${payload.links.join(', ')}`
      })
      .select("id")
      .single();

    if (error) throw error;

    // 2. Insert distribution records
    if (payload.distribution_targets.length > 0) {
      const distRecords = payload.distribution_targets.map(targetId => ({
        submission_id: submission.id,
        outlet_id: targetId,
        status: 'pending'
      }));
      const { error: distError } = await supabase
        .from("submission_distribution")
        .insert(distRecords);
      if (distError) throw distError;
    }

    // 3. Trigger Stripe Checkout
    await createSlotCheckoutSession(
      payload.slot_id,
      payload.slot_slug,
      submission.id,
      payload.distribution_targets
    );

    return submission.id;
  },

  async createWithCredits(payload: SubmissionPayload, accountId: string) {
    // Use the atomic RPC
    const { data: submissionId, error } = await supabase.rpc("submit_with_credits", {
      p_account_id: accountId,
      p_credits_to_consume: 1, // Currently fixed at 1 credit per submission
      p_submission_data: {
        artist_id: null, // Optional in RPC
        slot_id: payload.slot_id,
        track_title: payload.track_title,
        artist_name: payload.artist_name,
        spotify_track_url: payload.links[0] || "",
        release_date: payload.preferred_date,
        genre: "unknown", // Default or extract from description
        mood: payload.description,
        notes_internal: `Links: ${payload.links.join(', ')}`,
        submission_type: payload.submission_type,
        distribution_targets: payload.distribution_targets,
        content_bundle: {
          artist_name: payload.artist_name,
          title: payload.track_title,
          description: payload.description,
          links: payload.links,
          preferred_date: payload.preferred_date,
          media_urls: payload.media_urls || []
        }
      }
    });

    if (error) throw error;
    return submissionId;
  },

  async createWithCapability(payload: SubmissionPayload, userId: string, capability: string) {
    // This is the "admin/editor" route where they consume a capability instead of paying
    
    // 1. Consume capability
    const { data: consumed, error: consumeError } = await supabase.rpc("consume_capability", {
      p_user_id: userId,
      p_capability: capability
    });

    if (consumeError) throw consumeError;
    if (!consumed) throw new Error(`Insufficient ${capability} capabilities.`);

    // 2. Create paid submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: userId,
        slot_id: payload.slot_id,
        track_title: payload.track_title,
        artist_name: payload.artist_name,
        status: "pending",
        payment_status: "paid",
        payment_type: "credits", // Or 'capability' if we add it
        submission_type: payload.submission_type,
        distribution_targets: payload.distribution_targets,
        content_bundle: {
          artist_name: payload.artist_name,
          title: payload.track_title,
          description: payload.description,
          links: payload.links,
          preferred_date: payload.preferred_date,
          media_urls: payload.media_urls || []
        }
      })
      .select("id")
      .single();

    if (submissionError) throw submissionError;

    // 3. Distribution records
    if (payload.distribution_targets.length > 0) {
      const distRecords = payload.distribution_targets.map(targetId => ({
        submission_id: submission.id,
        outlet_id: targetId,
        status: 'pending'
      }));
      await supabase.from("submission_distribution").insert(distRecords);
    }

    return submission.id;
  }
};
