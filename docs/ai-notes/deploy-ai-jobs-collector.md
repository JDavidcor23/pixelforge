AI-generated source notes

# Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)

Needs someone with Supabase admin access on the PixelForge project. Run from the repo root.
Until every step is done the editor keeps working exactly as before (browser ledger only).

## 1. Apply the migration

```sh
supabase link --project-ref <project-ref>
supabase db push
```

Applies `supabase/migrations/20261012030000_ai_jobs.sql`: table `public.ai_jobs` + RLS,
extensions `pg_cron` and `pg_net`, and the cron job `collect-ai-jobs` (every minute).

## 2. Create the two Vault secrets (SQL editor, once)

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'pixelforge_project_url');
select vault.create_secret('<SECRET>', 'collect_ai_jobs_secret');
```

`<SECRET>`: a long random string, e.g. `openssl rand -hex 32`. Names must match exactly.

## 3. Set the Edge Function secrets

```sh
supabase secrets set COLLECT_AI_JOBS_SECRET=<SECRET> PIXELLAB_API_KEY=<pixellab key>
```

- `COLLECT_AI_JOBS_SECRET`: the SAME value as the Vault secret `collect_ai_jobs_secret`.
- `PIXELLAB_API_KEY`: the SAME PixelLab account as Vercel's `PIXELLAB_API_KEY` (the
  collector can only read jobs billed to that account).
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase automatically.

## 4. Deploy the function (no JWT check: it authorizes with the shared secret)

```sh
supabase functions deploy collect-ai-jobs --no-verify-jwt
```

## 5. Vercel env vars (project "editor")

| Var | Value | Note |
|---|---|---|
| `PIXELLAB_API_KEY` | PixelLab key | NOT set yet — add it (same key as the Edge Function secret) |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Already set; the submit function reads it at runtime too |
| `VITE_SUPABASE_ANON_KEY` | anon key | Already set; same as above |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | optional | Override the two above for the server only |

Never put the service role key in Vercel. Redeploy the editor after changing env vars.

## 6. Check it works

```sql
select jobname, schedule, active from cron.job where jobname = 'collect-ai-jobs';
select status, count(*) from public.ai_jobs group by status;
select status_code, content from net._http_response order by created desc limit 5;
```

The cron job only calls the function while some `ai_jobs` row is `pending`.
A `401` in `net._http_response` means the Vault secret and `COLLECT_AI_JOBS_SECRET` differ.
