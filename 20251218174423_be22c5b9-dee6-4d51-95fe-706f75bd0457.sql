-- Create affiliate_links table to store trackable links
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  campaign TEXT,
  source TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_clicks table to track individual clicks
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Public read access for affiliate links (needed for redirect)
CREATE POLICY "Anyone can view affiliate links"
ON public.affiliate_links
FOR SELECT
USING (true);

-- Allow inserts for click tracking (from edge function with service role)
CREATE POLICY "Service role can insert clicks"
ON public.affiliate_clicks
FOR INSERT
WITH CHECK (true);

-- Allow reading clicks for analytics
CREATE POLICY "Anyone can view click stats"
ON public.affiliate_clicks
FOR SELECT
USING (true);

-- Allow updating click count
CREATE POLICY "Anyone can update affiliate links"
ON public.affiliate_links
FOR UPDATE
USING (true);

-- Allow creating affiliate links
CREATE POLICY "Anyone can create affiliate links"
ON public.affiliate_links
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_affiliate_clicks_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX idx_affiliate_clicks_date ON public.affiliate_clicks(clicked_at);

-- Insert initial affiliate link for the GNX album
INSERT INTO public.affiliate_links (name, destination_url, campaign, source)
VALUES ('Kendrick Lamar - GNX Album', 'https://www.kendricklamar.com', 'album_release', 'sidebar_ad');