import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SubmissionPayload } from "@/lib/submissionService";
import { submissionService } from "@/lib/submissionService";

type SupabaseMocks = {
  supabase: {
    rpc: ReturnType<typeof vi.fn>;
    storage: {
      from: ReturnType<typeof vi.fn>;
    };
    functions: {
      invoke: ReturnType<typeof vi.fn>;
    };
  };
  mockRpc: ReturnType<typeof vi.fn>;
};

function getSupabaseMocks(): SupabaseMocks {
  if (!getSupabaseMocks.cache) {
    const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.test/submission.mp3" },
    });
    const mockRpc = vi.fn();
    const mockFunctionsInvoke = vi.fn();
    const mockStorageFrom = vi.fn(() => ({
      upload: mockStorageUpload,
      getPublicUrl: mockGetPublicUrl,
    }));

    getSupabaseMocks.cache = {
      supabase: {
        rpc: mockRpc,
        storage: {
          from: mockStorageFrom,
        },
        functions: {
          invoke: mockFunctionsInvoke,
        },
      },
      mockRpc,
    };
  }

  return getSupabaseMocks.cache;
}

namespace getSupabaseMocks {
  export let cache: SupabaseMocks | undefined;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: getSupabaseMocks().supabase,
}));

function getStripeMocks() {
  if (!getStripeMocks.cache) {
    getStripeMocks.cache = {
      createSlotCheckoutSession: vi.fn(),
    };
  }
  return getStripeMocks.cache;
}

namespace getStripeMocks {
  export let cache: { createSlotCheckoutSession: ReturnType<typeof vi.fn> } | undefined;
}

vi.mock("@/lib/stripe", () => ({
  createSlotCheckoutSession: getStripeMocks().createSlotCheckoutSession,
}));

function buildPayload(): SubmissionPayload {
  return {
    artist_name: "Test Artist",
    artist_email: "artist@example.com",
    track_title: "Test Song",
    spotify_track_url: "https://open.spotify.com/track/test",
    release_date: "2026-02-12",
    genre: "Experimental",
    mood: "Optimistic",
    slot_id: "slot-123",
    slot_slug: "new-music-monday",
    description: "Test submission description",
    links: ["https://example.com"],
    preferred_date: "2026-02-15",
    submission_type: "music",
    distribution_targets: ["outlet-1"],
  };
}

describe("submissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the capability RPC when paymentMethod is capability", async () => {
    const { mockRpc } = getSupabaseMocks();
    mockRpc.mockResolvedValueOnce({ data: "submission-cap", error: null });

    await submissionService.submit(
      buildPayload(),
      "user-abc",
      { paymentMethod: "capability", capability: "post.submit" },
    );

    expect(getSupabaseMocks().mockRpc).toHaveBeenCalledWith(
      "create_submission_v2",
      expect.objectContaining({
        p_payment_type: "capability",
        p_capability: "post.submit",
        p_user_id: "user-abc",
      }),
    );
    expect(getStripeMocks().createSlotCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates a Stripe session and calls the checkout helper", async () => {
    const { mockRpc } = getSupabaseMocks();
    mockRpc.mockResolvedValueOnce({ data: "submission-stripe", error: null });

    const payload = buildPayload();

    await submissionService.submit(
      payload,
      "user-stripe",
      { paymentMethod: "stripe" },
    );

    expect(getSupabaseMocks().mockRpc).toHaveBeenCalledWith(
      "create_submission_v2",
      expect.objectContaining({
        p_payment_type: "stripe",
        p_user_id: "user-stripe",
        p_slot_id: payload.slot_id,
      }),
    );

    expect(getStripeMocks().createSlotCheckoutSession).toHaveBeenCalledWith(
      payload.slot_id,
      payload.slot_slug,
      "submission-stripe",
      payload.distribution_targets,
    );
  });
});
