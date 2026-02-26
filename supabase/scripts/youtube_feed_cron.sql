-- Manual setup: schedule youtube-feed refresh every 30 minutes.
-- Run in Supabase SQL editor after deploying function and setting secrets.
-- Required secrets (Project Settings -> Edge Functions):
--   SUPABASE_URL
--   SUPABASE_SERVICE_ROLE_KEY
--   YOUTUBE_API_KEY

-- 1) Ensure extensions are available.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Replace these placeholders before running.
--    <PROJECT_REF> should be your Supabase project ref.
--    <SERVICE_ROLE_JWT> should be your service role key.

select cron.schedule(
  'youtube-feed-refresh-30m',
  '*/30 * * * *',
  $$
  select
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/youtube-feed-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_JWT>'
      ),
      body := '{"useConfiguredSources":true,"perChannelLimit":20}'::jsonb
    );
  $$
);

-- 3) Verify schedule exists.
select jobid, jobname, schedule, active from cron.job where jobname = 'youtube-feed-refresh-30m';
