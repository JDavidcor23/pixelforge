// Self-service account deletion (privacy policy "Delete your data").
// The caller's JWT identifies who is deleted — a user can only ever delete themself.
// Order matters: files first (Storage does not cascade), then the auth user, which
// cascades through profiles/projects/documents/assets via `on delete cascade`.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const STORAGE_BUCKET = 'pixelforge'
const LIST_PAGE_SIZE = 1000
const REMOVE_BATCH_SIZE = 100

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Envelope = { ok: true; data: { filesRemoved: number } } | { ok: false; error: { code: string; message: string } }

const respond = (status: number, body: Envelope) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

const fail = (status: number, code: string, message: string) => respond(status, { ok: false, error: { code, message } })

/** Recursively collects every object path under `prefix` (Storage lists one folder level at a time). */
async function collectPaths(
  storage: ReturnType<typeof createClient>['storage'],
  prefix: string,
): Promise<string[]> {
  const paths: string[] = []
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await storage.from(STORAGE_BUCKET).list(prefix, { limit: LIST_PAGE_SIZE, offset })
    if (error) throw error
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`
      // Folders come back with a null id; files carry one.
      if (entry.id === null) paths.push(...(await collectPaths(storage, path)))
      else paths.push(path)
    }
    if (data.length < LIST_PAGE_SIZE) return paths
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED', 'Use POST')

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return fail(401, 'UNAUTHENTICATED', 'Missing session token')

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(jwt)
  if (userError || !userData.user) return fail(401, 'UNAUTHENTICATED', 'Invalid or expired session')
  const userId = userData.user.id

  try {
    const paths = await collectPaths(admin.storage, userId)
    for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
      const { error } = await admin.storage.from(STORAGE_BUCKET).remove(paths.slice(i, i + REMOVE_BATCH_SIZE))
      if (error) throw error
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    const { error: logError } = await admin
      .from('account_deletions')
      .insert({ user_id: userId, files_removed: paths.length })
    // The account is already gone; a missing log row must not report the deletion as failed.
    if (logError) console.error('account_deletions insert failed', logError.message)

    return respond(200, { ok: true, data: { filesRemoved: paths.length } })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('delete-account failed', userId, message)
    return fail(500, 'DELETE_FAILED', 'Could not finish deleting the account. Retrying is safe and removes whatever is left.')
  }
})
