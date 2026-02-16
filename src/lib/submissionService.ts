import { supabase } from "@/integrations/supabase/client";
import { createSlotCheckoutSession } from "./stripe";
import { safeQuery } from "./supabase-debug";

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
   * High-level method to handle the entire submission process including media uploads.
   * Keeps the UI code extremely simple.
   */
  async submit(
    payload: SubmissionPayload, 
    userId: string | null, 
    options: { 
      paymentMethod: 'stripe' | 'capability';
      capability?: string;
      files?: File[];
      onUploadProgress?: (progress: number) => void;
      skipRedirect?: boolean;
    }
  ) {
    let submissionId: string;

    // 1. Create the submission (Atomic RPC)
    if (options.paymentMethod === 'capability') {
      if (!userId) throw new Error("User ID required for capability payment");
      if (!options.capability) throw new Error("Capability name required");
      submissionId = await this.createWithCapability(payload, userId, options.capability);
    } else {
      submissionId = await this.createWithStripe(payload, userId, options.skipRedirect);
    }

    // 2. Handle Media Uploads if files are provided
    if (options.files && options.files.length > 0) {
      const mediaUrls: string[] = [];
      for (const file of options.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${submissionId}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error for file:", file.name, uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
      }

      // 3. Update submission with media URLs
      if (mediaUrls.length > 0) {
        await safeQuery(
          supabase
          .from("submissions")
          .update({ 
            content_bundle: { 
              ...payload, 
              media_urls: mediaUrls 
            } 
          })
          .eq("id", submissionId)
        );
      }
    }

    return submissionId;
  },

  /**
   * Creates a submission intended for Stripe payment.
   * Uses the atomic create_submission_v2 RPC to ensure consistency.
   */
  async createWithStripe(payload: SubmissionPayload, userId: string | null, skipRedirect = false) {
    const submissionId = await safeQuery(
      supabase.rpc("create_submission_v2", {
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
      })
    );

    if (!submissionId) throw new Error("Failed to create submission");

    // Trigger Stripe Checkout if not skipped
    if (!skipRedirect) {
      await createSlotCheckoutSession(
        payload.slot_id,
        payload.slot_slug,
        submissionId as string,
        payload.distribution_targets
      );
    }

    return submissionId as string;
  },

  /**
   * Creates a submission using a User Capability (Editor/Admin).
   * Uses the atomic create_submission_v2 RPC.
   */
  async createWithCapability(payload: SubmissionPayload, userId: string, capability: string) {
    const submissionId = await safeQuery(
      supabase.rpc("create_submission_v2", {
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
      })
    );

    if (!submissionId) throw new Error("Failed to create submission");
    return submissionId as string;
  },

  /**
   * Verifies a payment session after redirect.
   * Calls an edge function to verify directly with Stripe for trustless confirmation.
   */
  async verifyPayment(submissionId?: string, sessionId?: string) {
    if (sessionId) {
      // Call edge function for direct verification
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId, submissionId }
      });
      
      if (error) {
        console.error("verify-payment invocation error:", error);
        throw error;
      }
      return data?.status === "paid" || data?.payment_status === "paid";
    }

    if (!submissionId) {
      throw new Error("Submission ID is required to verify payment when no session is available.");
    }

    // Fallback to DB check if no session ID
    const data = await safeQuery(
      supabase
        .from("submissions")
        .select("payment_status")
        .eq("id", submissionId)
        .single()
    );

    return data?.payment_status === "paid";
  }
};
