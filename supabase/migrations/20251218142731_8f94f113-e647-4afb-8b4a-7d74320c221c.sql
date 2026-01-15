-- Create posts table for Street Politics News
CREATE TABLE public.posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  youtube_id TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts (public news site)
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
USING (true);

-- Allow anyone to insert posts (for admin functionality - can be restricted later with auth)
CREATE POLICY "Anyone can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (true);

-- Seed with sample data
INSERT INTO public.posts (title, subtitle, youtube_id, thumbnail_url) VALUES
('Election Violence in Miami', 'Breaking coverage of the latest developments in South Florida', 'Xw8nQTl1Li8', 'https://img.youtube.com/vi/Xw8nQTl1Li8/maxresdefault.jpg'),
('Police Clash with Protesters in NYC', 'Live footage from the streets of Manhattan', 'dQw4w9WgXcQ', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'),
('Street Voices: Oakland', 'Exclusive interviews from the community', 'jNQXAC9IVRw', 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg');