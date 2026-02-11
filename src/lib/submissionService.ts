import { supabase } from "@/integrations/supabase/client";
import { createSlotCheckoutSession } from "./stripe";

export interface SubmissionPayload {
  artist_name: string;
  artist_email: string;
  artist_country?: string;
  track_title: string;
  spotify_track_url: string;
  release_date: string;
  genre: string;
  mood: string;
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
  /**
   * Creates a submission intended for Stripe payment.
   * Uses the atomic create_submission_v2 RPC to ensure consistency.
   */
  async createWithStripe(payload: SubmissionPayload, userId: string) {
    const { data: submissionId, error } = await supabase.rpc("create_submission_v2", {
      p_user_id: userId,
      p_slot_id: payload.slot_id,
      p_artist_data: {
        name: payload.artist_name,
        email: payload.artist_email,
        country: payload.artist_country
      },
      p_submission_data: {
        track_title: payload.track_title,
        spotify_track_url: payload.spotify_track_url,
        release_date: payload.release_date,
        genre: payload.genre,
        mood: payload.mood,
        submission_type: payload.submission_type,
        content_bundle: {
          description: payload.description,
          links: payload.links,
          preferred_date: payload.preferred_date,
          media_urls: payload.media_urls || []
        },
        notes_internal: `Links: ${payload.links.join(", ")}`
      },
      p_distribution_targets: payload.distribution_targets,
      p_payment_type: "stripe"
    });

    if (error) throw error;

    // Trigger Stripe Checkout
    await createSlotCheckoutSession(
      payload.slot_id,
      payload.slot_slug,
      submissionId,
      payload.distribution_targets
    );

    return submissionId;
  },

  /**
   * Creates a submission using a User Capability (Editor/Admin).
   * Uses the atomic create_submission_v2 RPC.
   */
  async createWithCapability(payload: SubmissionPayload, userId: string, capability: string) {
    const { data: submissionId, error } = await supabase.rpc("create_submission_v2", {
      p_user_id: userId,
      p_slot_id: payload.slot_id,
      p_artist_data: {
        name: payload.artist_name,
        email: payload.artist_email,
        country: payload.artist_country
      },
      p_submission_data: {
        track_title: payload.track_title,
        spotify_track_url: payload.spotify_track_url,
        release_date: payload.release_date,
        genre: payload.genre,
        mood: payload.mood,
        submission_type: payload.submission_type,
        content_bundle: {
          description: payload.description,
          links: payload.links,
          preferred_date: payload.preferred_date,
          media_urls: payload.media_urls || []
        },
        notes_internal: `Capability used: ${capability}. Links: ${payload.links.join(", ")}`
      },
      p_distribution_targets: payload.distribution_targets,
      p_payment_type: "capability",
      p_capability: capability
    });

    if (error) throw error;
    return submissionId;
  },

  /**
   * Verifies a payment session after redirect.
   * Calls an edge function to verify directly with Stripe for trustless confirmation.
   */
  async verifyPayment(submissionId: string, sessionId?: string) {
    if (sessionId) {
      // Call edge function for direct verification
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId, submissionId }
      });
      
      if (error) throw error;
      return data.status === "paid";
    }

    // Fallback to DB check if no session ID
    const { data, error } = await supabase
      .from("submissions")
      .select("payment_status")
      .eq("id", submissionId)
      .single();

    if (error) throw error;
    return data.payment_status === "paid";
  }
};
