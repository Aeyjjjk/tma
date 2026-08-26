// POST /functions/v1/admin-create-user
// Body: { username, password, name, role, dept, isAdmin, status }
// Only callable by an existing, active admin (enforced below, not just
// by the frontend hiding the button).
import { corsHeaders, jsonResponse, requireAdminCaller, adminClient, usernameToEmail } from '../_shared/helpers.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const caller = await requireAdminCaller(req);
    if (!caller) return jsonResponse({ error: 'Administrator access required' }, 403);

    const { username, password, name, role, dept, isAdmin, status } = await req.json().catch(() => ({}));
    if (!username || !password || !name) {
        return jsonResponse({ error: 'username, password, and name are required' }, 400);
    }
    if (String(password).length < 6) {
        return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    const admin = adminClient();
    const email = usernameToEmail(username);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // no email delivery configured for this internal-only login flow
    });
    if (createErr) {
        const msg = /already registered|already exists/i.test(createErr.message)
            ? 'That username is already taken'
            : createErr.message;
        return jsonResponse({ error: msg }, 400);
    }

    const { data: profile, error: profileErr } = await admin
        .from('profiles')
        .insert({
            id: created.user.id,
            username: username.trim(),
            name,
            role: role || '—',
            dept: dept || '—',
            is_admin: !!isAdmin,
            status: status || 'Active'
        })
        .select()
        .single();

    if (profileErr) {
        // Roll back the orphaned auth user rather than leaving a login
        // that has no profile and can never appear anywhere in the app.
        await admin.auth.admin.deleteUser(created.user.id);
        return jsonResponse({ error: profileErr.message }, 400);
    }

    return jsonResponse({ user: profile }, 201);
});
