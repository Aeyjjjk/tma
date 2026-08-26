// POST /functions/v1/admin-reset-all
// No body. Admin-only. Deletes every Supabase Auth user + profile and
// recreates a single default admin/admin123, and clears app_state.
// This needs the service_role key (deleting auth users isn't possible
// with the anon key even for an admin caller), which is why it's an Edge
// Function rather than something the frontend can do directly.
import { corsHeaders, jsonResponse, requireAdminCaller, adminClient, usernameToEmail } from '../_shared/helpers.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const caller = await requireAdminCaller(req);
    if (!caller) return jsonResponse({ error: 'Administrator access required' }, 403);

    const admin = adminClient();

    // Delete every existing auth user (profiles cascade-delete with them
    // via the FK's ON DELETE CASCADE).
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return jsonResponse({ error: listErr.message }, 500);
    for (const u of list.users) {
        await admin.auth.admin.deleteUser(u.id);
    }

    // Recreate the bootstrap admin.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: usernameToEmail('admin'),
        password: 'admin123',
        email_confirm: true
    });
    if (createErr) return jsonResponse({ error: createErr.message }, 500);

    await admin.from('profiles').insert({
        id: created.user.id,
        username: 'admin',
        name: 'Administrator',
        role: 'Administrator',
        dept: '—',
        is_admin: true,
        status: 'Active'
    });

    await admin
        .from('app_state')
        .update({ tyres: [], equipment: [], inspections: [], activity_log: [] })
        .eq('id', 1);

    return jsonResponse({ ok: true });
});
