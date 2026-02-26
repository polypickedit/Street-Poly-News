-- YouTube feed cache and source registry for cache-first ingestion.

CREATE TABLE IF NOT EXISTS public.youtube_feed_sources (
  channel_id TEXT PRIMARY KEY,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.youtube_feed_cache (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL,
  channel_title TEXT,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  published_at TIMESTAMPTZ,
  view_count BIGINT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_youtube_feed_cache_channel_published
  ON public.youtube_feed_cache (channel_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_youtube_feed_cache_fetched_at
  ON public.youtube_feed_cache (fetched_at DESC);

ALTER TABLE public.youtube_feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_feed_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'youtube_feed_sources'
      AND policyname = 'Anyone can view youtube sources'
  ) THEN
    CREATE POLICY "Anyone can view youtube sources"
      ON public.youtube_feed_sources
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'youtube_feed_cache'
      AND policyname = 'Anyone can view youtube cache'
  ) THEN
    CREATE POLICY "Anyone can view youtube cache"
      ON public.youtube_feed_cache
      FOR SELECT
      USING (true);
  END IF;
END $$;
