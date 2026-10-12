-- Proof-of-compliance log for self-service account deletion.
-- Holds NO personal data: only the deleted auth id, when it happened and how many files were removed.
-- Written exclusively by the `delete-account` Edge Function (service role); invisible to clients.

create table public.account_deletions (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  deleted_at timestamptz not null default now(),
  files_removed integer not null default 0 check (files_removed >= 0)
);

alter table public.account_deletions enable row level security;
-- No policies on purpose: anon/authenticated can neither read nor write; the service role bypasses RLS.
revoke all on table public.account_deletions from anon, authenticated;
