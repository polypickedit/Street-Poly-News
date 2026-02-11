-- Migration: Align Playlists with Admin Editorial Pattern
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS spotify_playlist_id TEXT,
ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS moods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS energy_level INTEGER,
ADD COLUMN IF NOT EXISTS submission_notes TEXT;

-- Sync existing data if any
UPDATE public.playlists 
SET genres = ARRAY[primary_genre] 
WHERE primary_genre IS NOT NULL AND (genres IS NULL OR cardinality(genres) = 0);

UPDATE public.playlists 
SET moods = ARRAY[primary_mood] 
WHERE primary_mood IS NOT NULL AND (moods IS NULL OR cardinality(moods) = 0);
