import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CacheRow = {
  channel_id: string;
  channel_title: string | null;
  video_id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  published_at: string | null;
  view_count: number | null;
  fetched_at: string;
};

type FeedItem = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  publishedAt: string | null;
  channelId: string;
  channelTitle: string;
  viewCount: number | null;
};

function clampDescription(input: string, max = 240): string {
  if (!input) return "";
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

function toUniqueStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [
    ...new Set(
      input
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    ),
  ];
}

function normalizeRow(row: CacheRow): FeedItem {
  return {
    id: row.video_id,
    videoId: row.video_id,
    title: row.title,
    description: clampDescription(row.description ?? ""),
    thumbnail: row.thumbnail,
    publishedAt: row.published_at,
    channelId: row.channel_id,
    channelTitle: row.channel_title ?? "",
    viewCount: row.view_count,
  };
}

function buildResponse(items: FeedItem[], extra: Record<string, unknown> = {}) {
  const byId = Object.fromEntries(items.map((item) => [item.videoId, item]));
  return new Response(JSON.stringify({ items, byId, ...extra }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const videoIds = toUniqueStrings(body?.videoIds);
    let channelIds = toUniqueStrings(body?.channelIds);
    const useConfiguredSources = Boolean(body?.useConfiguredSources);

    const limit =
      typeof body?.limit === "number"
        ? Math.max(1, Math.min(body.limit, 100))
        : 30;

    const beforePublishedAt =
      typeof body?.beforePublishedAt === "string" && body.beforePublishedAt.trim().length > 0
        ? body.beforePublishedAt.trim()
        : null;

    if (!channelIds.length && useConfiguredSources) {
      const { data: sources, error: sourcesError } = await supabase
        .from("youtube_feed_sources")
        .select("channel_id")
        .eq("active", true);
      if (sourcesError) throw new Error(`Failed to load configured sources: ${sourcesError.message}`);
      channelIds = (sources ?? []).map((row: { channel_id: string }) => row.channel_id);
    }

    if (videoIds.length > 0) {
      const { data, error } = await supabase
        .from("youtube_feed_cache")
        .select("channel_id, channel_title, video_id, title, description, thumbnail, published_at, view_count, fetched_at")
        .in("video_id", videoIds);
      if (error) throw new Error(`Failed to read cache by video IDs: ${error.message}`);

      const byVideoId = new Map((data ?? []).map((row: CacheRow) => [row.video_id, normalizeRow(row)]));
      const ordered = videoIds.map((id) => byVideoId.get(id)).filter((item): item is FeedItem => !!item);
      return buildResponse(ordered, { source: "cache", mode: "videoIds" });
    }

    let query = supabase
      .from("youtube_feed_cache")
      .select("channel_id, channel_title, video_id, title, description, thumbnail, published_at, view_count, fetched_at")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (channelIds.length > 0) query = query.in("channel_id", channelIds);
    if (beforePublishedAt) query = query.lt("published_at", beforePublishedAt);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to read feed cache: ${error.message}`);

    const items = ((data ?? []) as CacheRow[]).map(normalizeRow);
    return buildResponse(items, {
      source: "cache",
      mode: "feed",
      page: {
        limit,
        nextBeforePublishedAt: items.length ? items[items.length - 1].publishedAt : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
