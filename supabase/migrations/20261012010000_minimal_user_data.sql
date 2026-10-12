-- Data minimization: keep only what sign-in strictly needs (provider id + email).
-- Google sends name and picture on every sign-in and Supabase Auth copies them into
-- auth.users.raw_user_meta_data and auth.identities.identity_data; strip them on the way in.

alter table public.profiles drop column display_name, drop column avatar_url;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.strip_identity_profile_data(data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(data, '{}'::jsonb)
    - 'name' - 'full_name' - 'given_name' - 'family_name' - 'nickname'
    - 'picture' - 'avatar_url' - 'preferred_username' - 'user_name' - 'locale'
$$;

revoke execute on function public.strip_identity_profile_data(jsonb) from public, anon, authenticated;

create or replace function public.strip_user_profile_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.raw_user_meta_data = public.strip_identity_profile_data(new.raw_user_meta_data);
  return new;
end;
$$;

create or replace function public.strip_identity_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.identity_data = public.strip_identity_profile_data(new.identity_data);
  return new;
end;
$$;

revoke execute on function public.strip_user_profile_data() from public, anon, authenticated;
revoke execute on function public.strip_identity_data() from public, anon, authenticated;

create trigger strip_user_profile_data
  before insert or update of raw_user_meta_data on auth.users
  for each row execute function public.strip_user_profile_data();

create trigger strip_identity_data
  before insert or update of identity_data on auth.identities
  for each row execute function public.strip_identity_data();
