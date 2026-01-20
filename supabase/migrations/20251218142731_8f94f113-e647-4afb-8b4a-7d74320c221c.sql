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
('Tampa meets Memphis in ATL BMY Treydawg & Foreign Freckles at #NewMusicMondays', 'Coalition DJs showcase captures BMY Treydawg & Foreign Freckles bringing new talent energy.', '3PXQSs-FsK4', 'https://i4.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg'),
('@superspodeeotm Opens Up: The Dark Truth About Designer Drugs & His Journey to Sobriety! 🚨', 'Spodee shares how he beat addiction and why authenticity matters in the streets.', 'Uxnw9TANizo', 'https://i2.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg');
