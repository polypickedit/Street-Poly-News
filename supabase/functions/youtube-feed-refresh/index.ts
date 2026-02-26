import { serve } from "std/server";
import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type YoutubeThumbnail = { url?: string };

type YoutubeSnippet = {
  title?: string;
  description?: string;
  publishedAt?: string;
  channelTitle?: string;
  channelId?: string;
  thumbnails?: {
    medium?: YoutubeThumbnail;
    high?: YoutubeThumbnail;
  };
};

type YoutubeChannelItem = {
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

type YoutubePlaylistItem = {
  snippet?: YoutubeSnippet;
  contentDetails?: {
    videoId?: string;
  };
};

type YoutubeVideoItem = {
  id?: string;
  snippet?: YoutubeSnippet;
  statistics?: {
    viewCount?: string;
  };
};

type CachedItem = {
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

type UpsertRow = {
  channel_id: string;
  channel_title: string | null;
  video_id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  published_at: string | null;
  view_count: number | null;
  fetched_at: string;
};

function clampDescription(input: string, max = 240): string {
  if (!input) return "";
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

function uniqueStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [
    ...new Set(
      input
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0)
    ),
  ];
}

function normalizePlaylistItem(channelId: string, item: YoutubePlaylistItem): CachedItem | null {
  const videoId = item.contentDetails?.videoId ?? "";
  const snippet = item.snippet ?? {};
  if (!videoId || !snippet.title) return null;
  return {
    id: videoId,
    videoId,
    title: snippet.title,
    description: clampDescription(snippet.description ?? ""),
    thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.high?.url ?? null,
    publishedAt: snippet.publishedAt ?? null,
    channelId: snippet.channelId ?? channelId,
    channelTitle: snippet.channelTitle ?? "",
    viewCount: null,
  };
}

function normalizeVideoItem(item: YoutubeVideoItem): CachedItem | null {
  const videoId = item.id ?? "";
  const snippet = item.snippet ?? {};
  const channelId = snippet.channelId ?? "";
  if (!videoId || !snippet.title || !channelId) return null;

  return {
    id: videoId,
    videoId,
    title: snippet.title,
    description: clampDescription(snippet.description ?? ""),
    thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.high?.url ?? null,
    publishedAt: snippet.publishedAt ?? null,
    channelId,
    channelTitle: snippet.channelTitle ?? "",
    viewCount: item.statistics?.viewCount ? Number.parseInt(item.statistics.viewCount, 10) : null,
  };
}

async function fetchUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  const params = new URLSearchParams({ part: "contentDetails", id: channelId, key: apiKey });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`YouTube channels API failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const payload = (await res.json()) as { items?: YoutubeChannelItem[] };
  return payload.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function fetchVideosByIds(apiKey: string, videoIds: string[]): Promise<CachedItem[]> {
  if (!videoIds.length) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));

  const results: CachedItem[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      part: "snippet,statistics",
      id: chunk.join(","),
      key: apiKey,
      maxResults: String(chunk.length),
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`YouTube videos API failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const payload = (await res.json()) as { items?: YoutubeVideoItem[] };
    for (const item of payload.items ?? []) {
      const normalized = normalizeVideoItem(item);
      if (normalized) results.push(normalized);
    }
  }
  return results;
}

async function assertRefreshAuthorized(
  req: Request,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ authorized: true; reason: "service_role" | "admin_or_editor" } | { authorized: false; status: number; error: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) return { authorized: false, status: 401, error: "Missing bearer token" };
  if (token === serviceRoleKey) return { authorized: true, reason: "service_role" };

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { authorized: false, status: 401, error: "Invalid token" };

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userData.user.id);

  if (roleError) return { authorized: false, status: 403, error: "Unable to verify roles" };

  const roleNames = (roleRows ?? [])
    .map((row: { roles?: { name?: string } | null }) => row.roles?.name ?? "")
    .filter((name) => name.length > 0);

  if (roleNames.includes("admin") || roleNames.includes("editor")) {
    return { authorized: true, reason: "admin_or_editor" };
  }

  return { authorized: false, status: 403, error: "Requires admin/editor role" };
}

function toUpsertRows(items: CachedItem[], fetchedAt: string): UpsertRow[] {
  return items.map((item) => ({
    channel_id: item.channelId,
    channel_title: item.channelTitle || null,
    video_id: item.videoId,
    title: item.title,
    description: item.description,
    thumbnail: item.thumbnail,
    published_at: item.publishedAt,
    view_count: item.viewCount,
    fetched_at: fetchedAt,
  }));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!apiKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const auth = await assertRefreshAuthorized(req, supabaseUrl, serviceRoleKey);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const perChannelLimit =
      typeof body?.perChannelLimit === "number" ? Math.max(1, Math.min(body.perChannelLimit, 50)) : 20;

    const inputVideoIds = uniqueStrings(body?.videoIds);
    let inputChannelIds = uniqueStrings(body?.channelIds);

    if (!inputChannelIds.length && body?.useConfiguredSources) {
      const { data: sources, error: sourceError } = await supabase
        .from("youtube_feed_sources")
        .select("channel_id")
        .eq("active", true);
      if (sourceError) throw new Error(`Failed to load configured sources: ${sourceError.message}`);
      inputChannelIds = (sources ?? []).map((row: { channel_id: string }) => row.channel_id);
    }

    if (!inputVideoIds.length && !inputChannelIds.length) {
      return new Response(JSON.stringify({ error: "Missing videoIds or channelIds (or useConfiguredSources=true)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const failures: { scope: "video" | "channel"; id: string; error: string }[] = [];
    const ingestItems: CachedItem[] = [];

    if (inputVideoIds.length) {
      try {
        const videoItems = await fetchVideosByIds(apiKey, inputVideoIds);
        ingestItems.push(...videoItems);
      } catch (error) {
        failures.push({
          scope: "video",
          id: inputVideoIds.join(","),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    for (const channelId of inputChannelIds) {
      try {
        const uploadsPlaylistId = await fetchUploadsPlaylistId(apiKey, channelId);
        if (!uploadsPlaylistId) {
          failures.push({ scope: "channel", id: channelId, error: "Missing uploads playlist" });
          continue;
        }

        const params = new URLSearchParams({
          part: "snippet,contentDetails",
          playlistId: uploadsPlaylistId,
          maxResults: String(perChannelLimit),
          key: apiKey,
        });

        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);
        if (!res.ok) {
          const detail = await res.text();
          throw new Error(`YouTube playlistItems API failed (${res.status}): ${detail.slice(0, 300)}`);
        }

        const payload = (await res.json()) as { items?: YoutubePlaylistItem[] };
        for (const rawItem of payload.items ?? []) {
          const item = normalizePlaylistItem(channelId, rawItem);
          if (item) ingestItems.push(item);
        }
      } catch (error) {
        failures.push({
          scope: "channel",
          id: channelId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const dedupedByVideoId = new Map<string, CachedItem>();
    for (const item of ingestItems) dedupedByVideoId.set(item.videoId, item);
    const dedupedItems = [...dedupedByVideoId.values()];

    if (dedupedItems.length) {
      const fetchedAt = new Date().toISOString();
      const rows = toUpsertRows(dedupedItems, fetchedAt);
      const { error: upsertError } = await supabase
        .from("youtube_feed_cache")
        .upsert(rows, { onConflict: "video_id" });
      if (upsertError) throw new Error(`Failed to upsert cache: ${upsertError.message}`);
    }

    const byId = Object.fromEntries(dedupedItems.map((item) => [item.videoId, item]));
    return new Response(
      JSON.stringify({
        refreshed: dedupedItems.length,
        failures,
        items: dedupedItems,
        byId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
