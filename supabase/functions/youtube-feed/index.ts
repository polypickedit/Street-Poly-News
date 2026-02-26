const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type YoutubeThumbnail = {
  url?: string;
};

type YoutubeSnippet = {
  title?: string;
  description?: string;
  publishedAt?: string;
  channelTitle?: string;
  thumbnails?: {
    medium?: YoutubeThumbnail;
    high?: YoutubeThumbnail;
    default?: YoutubeThumbnail;
  };
};

type YoutubeVideoItem = {
  id?: string;
  snippet?: YoutubeSnippet;
  statistics?: {
    viewCount?: string;
  };
};

type YoutubeChannelItem = {
  id?: string;
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

function clampDescription(input: string, max = 160): string {
  if (!input) return "";
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

function normalizeVideo(item: YoutubeVideoItem) {
  const snippet = item.snippet ?? {};
  const thumbnails = snippet.thumbnails ?? {};
  const thumbnail =
    thumbnails.medium?.url ??
    thumbnails.high?.url ??
    thumbnails.default?.url ??
    null;

  return {
    id: item.id ?? "",
    videoId: item.id ?? "",
    title: snippet.title ?? "",
    description: clampDescription(snippet.description ?? ""),
    thumbnail,
    publishedAt: snippet.publishedAt ?? null,
    channel: snippet.channelTitle ?? "",
    channelTitle: snippet.channelTitle ?? "",
    viewCount: item.statistics?.viewCount
      ? Number.parseInt(item.statistics.viewCount, 10)
      : null,
  };
}

function normalizePlaylistVideo(item: YoutubePlaylistItem) {
  const snippet = item.snippet ?? {};
  const thumbnails = snippet.thumbnails ?? {};
  const videoId = item.contentDetails?.videoId ?? "";

  return {
    id: videoId,
    videoId,
    title: snippet.title ?? "",
    description: clampDescription(snippet.description ?? ""),
    thumbnail:
      thumbnails.medium?.url ??
      thumbnails.high?.url ??
      thumbnails.default?.url ??
      null,
    publishedAt: snippet.publishedAt ?? null,
    channel: snippet.channelTitle ?? "",
    channelTitle: snippet.channelTitle ?? "",
    viewCount: null,
  };
}

function uniqueVideoIds(videoIds: unknown): string[] {
  if (!Array.isArray(videoIds)) return [];
  const ids = videoIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id) => id.length > 0);
  return [...new Set(ids)];
}

function uniqueChannelIds(channelIds: unknown): string[] {
  if (!Array.isArray(channelIds)) return [];
  const ids = channelIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id) => id.length > 0);
  return [...new Set(ids)];
}

async function fetchVideosByIds(apiKey: string, videoIds: string[]) {
  if (videoIds.length === 0) return [];

  // YouTube videos.list supports up to 50 IDs per request.
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const results: ReturnType<typeof normalizeVideo>[] = [];

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
    const items = payload.items ?? [];
    for (const item of items) {
      if (item.id) results.push(normalizeVideo(item));
    }
  }

  return results;
}

async function fetchUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  const params = new URLSearchParams({
    part: "contentDetails",
    id: channelId,
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`YouTube channels API failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await res.json()) as { items?: YoutubeChannelItem[] };
  const item = payload.items?.[0];
  return item?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function fetchPlaylistVideos(
  apiKey: string,
  uploadsPlaylistId: string,
  maxResults = 10,
  pageToken?: string
) {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: String(Math.max(1, Math.min(maxResults, 50))),
    key: apiKey,
  });

  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`YouTube playlistItems API failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await res.json()) as {
    items?: YoutubePlaylistItem[];
    nextPageToken?: string;
  };

  const items = (payload.items ?? [])
    .map(normalizePlaylistVideo)
    .filter((item) => item.videoId.length > 0);

  return {
    items,
    nextPageToken: payload.nextPageToken ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const videoIds = uniqueVideoIds(body?.videoIds);
    const channelIds = uniqueChannelIds(body?.channelIds);

    if (videoIds.length === 0 && channelIds.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (videoIds.length > 0) {
      const items = await fetchVideosByIds(apiKey, videoIds);
      const byId = Object.fromEntries(items.map((item) => [item.videoId, item]));

      return new Response(JSON.stringify({ items, byId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perChannelLimit =
      typeof body?.perChannelLimit === "number" ? body.perChannelLimit : 10;
    const channelPageTokens =
      typeof body?.channelPageTokens === "object" && body.channelPageTokens
        ? (body.channelPageTokens as Record<string, string>)
        : {};

    const channelResults = await Promise.all(
      channelIds.map(async (channelId) => {
        const uploadsPlaylistId = await fetchUploadsPlaylistId(apiKey, channelId);
        if (!uploadsPlaylistId) {
          return { channelId, items: [], nextPageToken: null as string | null };
        }

        const { items, nextPageToken } = await fetchPlaylistVideos(
          apiKey,
          uploadsPlaylistId,
          perChannelLimit,
          channelPageTokens[channelId]
        );

        return { channelId, items, nextPageToken };
      })
    );

    const items = channelResults
      .flatMap((result) => result.items)
      .sort((a, b) => {
        const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bTime - aTime;
      });

    const channelNextPageTokens: Record<string, string> = {};
    for (const result of channelResults) {
      if (result.nextPageToken) {
        channelNextPageTokens[result.channelId] = result.nextPageToken;
      }
    }

    const byId = Object.fromEntries(items.map((item) => [item.videoId, item]));

    return new Response(
      JSON.stringify({
        items,
        byId,
        channelNextPageTokens,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
