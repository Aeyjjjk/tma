// POST /functions/v1/admin-purge-user
// Body: { username }
// Admin-only. Permanently deletes the Supabase Auth user — the profile
// row cascades away automatically (profiles.id references auth.users.id
// on delete cascade), so there's nothing else to clean up here. This has
// to be an Edge Function (not a client-side delete) because removing an
// Auth user needs the service_role key.
import { corsHeaders, jsonResponse, requireAdminCaller, adminClient } from '../_shared/helpers.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const caller = await requireAdminCaller(req);
    if (!caller) return jsonResponse({ error: 'Administrator access required' }, 403);

    const { username } = await req.json().catch(() => ({}));
    if (!username) return jsonResponse({ error: 'username is required' }, 400);

    const admin = adminClient();
    const { data: target } = await admin.from('profiles').select('id').eq('username', username).single();
    if (!target) return jsonResponse({ error: 'User not found' }, 404);

    const { error } = await admin.auth.admin.deleteUser(target.id);
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true });
});