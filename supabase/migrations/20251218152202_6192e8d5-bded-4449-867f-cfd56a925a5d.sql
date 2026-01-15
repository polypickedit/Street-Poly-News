-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('video', 'article', 'gallery');

-- Expand posts table with new columns
ALTER TABLE public.posts 
ADD COLUMN content_type public.content_type DEFAULT 'video',
ADD COLUMN body_content TEXT,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN is_breaking BOOLEAN DEFAULT false,
ADD COLUMN view_count INTEGER DEFAULT 0;

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Anyone can create categories (for now - can restrict to admin later)
CREATE POLICY "Anyone can create categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

-- Create post_categories junction table
CREATE TABLE public.post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

-- Enable RLS on post_categories
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

-- Post categories are viewable by everyone
CREATE POLICY "Anyone can view post_categories" 
ON public.post_categories 
FOR SELECT 
USING (true);

-- Anyone can create post_categories
CREATE POLICY "Anyone can create post_categories" 
ON public.post_categories 
FOR INSERT 
WITH CHECK (true);

-- Create people table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on people
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- People are viewable by everyone
CREATE POLICY "Anyone can view people" 
ON public.people 
FOR SELECT 
USING (true);

-- Anyone can create people
CREATE POLICY "Anyone can create people" 
ON public.people 
FOR INSERT 
WITH CHECK (true);

-- Create post_people junction table
CREATE TABLE public.post_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, person_id)
);

-- Enable RLS on post_people
ALTER TABLE public.post_people ENABLE ROW LEVEL SECURITY;

-- Post people are viewable by everyone
CREATE POLICY "Anyone can view post_people" 
ON public.post_people 
FOR SELECT 
USING (true);

-- Anyone can create post_people
CREATE POLICY "Anyone can create post_people" 
ON public.post_people 
FOR INSERT 
WITH CHECK (true);

-- Insert some default categories
INSERT INTO public.categories (name, slug, color) VALUES
('Politics', 'politics', '#dc2626'),
('Sports', 'sports', '#16a34a'),
('Music', 'music', '#9333ea'),
('Entertainment', 'entertainment', '#f59e0b'),
('News', 'news', '#3b82f6'),
('Exclusive', 'exclusive', '#ec4899');