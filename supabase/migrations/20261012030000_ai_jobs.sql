-- Server-owned AI jobs (ADR 0009 follow-up). PixelLab has no webhooks and no job listing:
-- the only way to collect a finished job is `GET /v2/background-jobs/{id}`. When only the
-- browser knew that id, closing the tab lost a PAID generation. Now the submit function
-- (`apps/editor/api/ai/pixellab/animate.ts`) writes the id here with the user's JWT, and the
-- `collect-ai-jobs` Edge Function (pg_cron, every minute) turns finished jobs into
-- `public.assets` rows + frames in Storage, whether or not a browser is open.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider text not null default 'pixellab' check (provider in ('pixellab')),
  provider_job_id text not null unique check (char_length(provider_job_id) between 1 and 200),
  kind public.asset_kind not null default 'animation' check (kind = 'animation'),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  label text check (label is null or char_length(label) <= 120),
  asset_type text check (asset_type is null or char_length(asset_type) <= 40),
  frame_count integer check (frame_count is null or frame_count > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  params jsonb not null default '{}'::jsonb,
  -- The asset row reuses this row's id (`assets.id = ai_jobs.id`), so a collector
  -- running twice can never create two assets for one job.
  asset_id uuid references public.assets (id) on delete set null,
  error text,
  attempts integer not null default 0 check (attempts >= 0),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_jobs_owner_id_idx on public.ai_jobs (owner_id);
create index ai_jobs_asset_id_idx on public.ai_jobs (asset_id);
-- The collector's only query: oldest pending first.
create index ai_jobs_pending_idx on public.ai_jobs (created_at) where status = 'pending';

create trigger ai_jobs_set_updated_at
  before update on public.ai_jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The owner reads and inserts their own rows and may delete them. Only the
-- collector (service role, bypasses RLS) moves a row out of `pending`: a client
-- can never mark a job completed or point it at an asset.
-- ---------------------------------------------------------------------------
alter table public.ai_jobs enable row level security;

revoke all on table public.ai_jobs from anon;
revoke update, truncate, references, trigger on table public.ai_jobs from authenticated;

create policy "ai_jobs: owner reads" on public.ai_jobs
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "ai_jobs: owner inserts pending" on public.ai_jobs
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and status = 'pending'
    and asset_id is null
    and error is null
    and attempts = 0
    and last_checked_at is null
  );

create policy "ai_jobs: owner deletes" on public.ai_jobs
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- Schedule: pg_cron calls the `collect-ai-jobs` Edge Function every minute.
--
-- Nothing secret is hardcoded. Before this job can succeed, someone with admin
-- access creates TWO Vault secrets (SQL editor, once per project):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'pixelforge_project_url');
--   select vault.create_secret('<long random string>', 'collect_ai_jobs_secret');
--
-- and sets the SAME random string as the Edge Function secret
-- `COLLECT_AI_JOBS_SECRET`. The function is deployed with `--no-verify-jwt`
-- and authorizes the call with the `x-collector-secret` header instead.
-- Until the secrets exist the subqueries return null and the request is skipped.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: re-running the migration replaces the job instead of duplicating it.
select cron.unschedule(jobid) from cron.job where jobname = 'collect-ai-jobs';

select cron.schedule(
  'collect-ai-jobs',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'pixelforge_project_url')
      || '/functions/v1/collect-ai-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-collector-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'collect_ai_jobs_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  )
  where exists (select 1 from public.ai_jobs where status = 'pending')
    and exists (select 1 from vault.decrypted_secrets where name = 'pixelforge_project_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'collect_ai_jobs_secret');
  $$
);
