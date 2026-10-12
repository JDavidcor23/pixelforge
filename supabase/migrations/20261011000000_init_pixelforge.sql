-- PixelForge cloud storage: profiles, projects (one per game), editor documents and generated assets.
-- Binary data (layer buffers, PNGs, sheets) lives in the private `pixelforge` Storage bucket;
-- tables keep metadata plus the storage path. Every row is owned by the auth user and guarded by RLS.

-- ---------------------------------------------------------------------------
-- Profiles (filled automatically on sign-up, e.g. Google OAuth)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Only the auth trigger may run it; never expose it through /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Projects: one per game
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Documents: editable sprite drafts (mirror of the local StoredDocument).
-- `payload_path` points to the serialized DocumentPayload in Storage;
-- `revision` is the optimistic-concurrency counter for future sync.
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  name text not null default 'Untitled' check (char_length(name) between 1 and 120),
  schema_version integer not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  frame_count integer not null default 1 check (frame_count > 0),
  revision integer not null default 0 check (revision >= 0),
  payload_path text not null,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_owner_id_idx on public.documents (owner_id);
create index documents_project_id_idx on public.documents (project_id);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Assets: finished pieces of a game (AI generations, animations, tilesets, maps, sounds)
-- ---------------------------------------------------------------------------
create type public.asset_kind as enum ('sprite', 'animation', 'tileset', 'map', 'sound');
create type public.asset_source as enum ('manual', 'retro_diffusion', 'pixellab', 'openai', 'elevenlabs');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  kind public.asset_kind not null,
  source public.asset_source not null default 'manual',
  name text not null default 'Untitled' check (char_length(name) between 1 and 120),
  prompt text,
  params jsonb not null default '{}'::jsonb,
  width integer check (width > 0),
  height integer check (height > 0),
  frame_count integer check (frame_count > 0),
  frame_ms integer[],
  file_path text not null,
  cost_usd numeric(10, 4),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_owner_id_idx on public.assets (owner_id);
create index assets_project_id_idx on public.assets (project_id);
create index assets_document_id_idx on public.assets (document_id);
create index assets_owner_kind_idx on public.assets (owner_id, kind);

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: each user sees and edits only their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.assets enable row level security;

create policy "profiles: owner reads" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: owner updates" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "projects: owner all" on public.projects
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "documents: owner all" on public.documents
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (project_id is null or exists (
      select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())
    ))
  );

create policy "assets: owner all" on public.assets
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (project_id is null or exists (
      select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())
    ))
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket, files under `<user_id>/...`
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('pixelforge', 'pixelforge', false, 52428800)
on conflict (id) do nothing;

create policy "pixelforge storage: owner reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'pixelforge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pixelforge storage: owner inserts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pixelforge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pixelforge storage: owner updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'pixelforge' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'pixelforge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pixelforge storage: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pixelforge' and (storage.foldername(name))[1] = (select auth.uid())::text);
