// POST /functions/v1/admin-set-password
// Body: { username, password }
// Admins can set anyone's password; a non-admin can only set their own
// (self-service password change) — enforced below, not by the UI.
import { corsHeaders, jsonResponse, requireAuthenticatedCaller, adminClient, usernameToEmail } from '../_shared/helpers.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const caller = await requireAuthenticatedCaller(req);
    if (!caller) return jsonResponse({ error: 'Not authenticated' }, 401);

    const { username, password } = await req.json().catch(() => ({}));
    if (!username || !password) return jsonResponse({ error: 'username and password are required' }, 400);
    if (String(password).length < 6) return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);

    const admin = adminClient();

    const { data: callerProfile } = await admin.from('profiles').select('*').eq('id', caller.id).single();
    const { data: targetProfile } = await admin.from('profiles').select('*').eq('username', username).single();
    if (!targetProfile) return jsonResponse({ error: 'User not found' }, 404);

    const isSelf = callerProfile && callerProfile.username === username;
    const isAdmin = callerProfile && callerProfile.is_admin && !callerProfile.deleted;
    if (!isAdmin && !isSelf) return jsonResponse({ error: 'You can only change your own password' }, 403);

    const { error } = await admin.auth.admin.updateUserById(targetProfile.id, { password });
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true });
});
