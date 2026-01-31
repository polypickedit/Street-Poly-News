-- Tighten RLS policies for content management tables
-- This migration removes public write access and restricts it to admins and editors

-- 1. Posts
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;
CREATE POLICY "Admins and Editors can manage posts" 
ON public.posts 
FOR ALL 
USING (public.is_admin_or_editor());

-- 2. Categories
DROP POLICY IF EXISTS "Anyone can create categories" ON public.categories;
CREATE POLICY "Admins and Editors can manage categories" 
ON public.categories 
FOR ALL 
USING (public.is_admin_or_editor());

-- 3. Post Categories
DROP POLICY IF EXISTS "Anyone can create post_categories" ON public.post_categories;
CREATE POLICY "Admins and Editors can manage post_categories" 
ON public.post_categories 
FOR ALL 
USING (public.is_admin_or_editor());

-- 4. People
DROP POLICY IF EXISTS "Anyone can create people" ON public.people;
CREATE POLICY "Admins and Editors can manage people" 
ON public.people 
FOR ALL 
USING (public.is_admin_or_editor());

-- 5. Post People
DROP POLICY IF EXISTS "Anyone can create post_people" ON public.post_people;
CREATE POLICY "Admins and Editors can manage post_people" 
ON public.post_people 
FOR ALL 
USING (public.is_admin_or_editor());

-- 6. Affiliate Links
DROP POLICY IF EXISTS "Anyone can create affiliate links" ON public.affiliate_links;
DROP POLICY IF EXISTS "Anyone can update affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins and Editors can manage affiliate links" 
ON public.affiliate_links 
FOR ALL 
USING (public.is_admin_or_editor());

-- Allow public to update click_count (needed for the tracking redirect)
CREATE POLICY "Public can increment click count"
ON public.affiliate_links
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 7. Contact Submissions (if it exists)
-- Checking if table exists first
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_submissions') THEN
        ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;
        CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Admins and Editors can view contact submissions" ON public.contact_submissions;
        CREATE POLICY "Admins and Editors can view contact submissions" ON public.contact_submissions FOR SELECT USING (public.is_admin_or_editor());
    END IF;
END $$;
