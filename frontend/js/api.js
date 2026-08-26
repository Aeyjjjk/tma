// ============================================================
// API — now backed by Supabase (Postgres + Auth + Realtime) instead of
// a hand-rolled server. Same function names/shapes as the previous
// version of this file, so main.js and modals.js didn't need rewrites.
// ============================================================
//
// SUPABASE_URL and SUPABASE_ANON_KEY below are meant to be public — this
// is how Supabase is designed. The anon key on its own can't do anything
// beyond what Row Level Security in the database allows (see
// supabase/migrations/0001_init.sql). Real security lives in those RLS
// policies and in the service_role key used only inside Edge Functions
// (supabase/functions/*), which never reaches the browser.
const SUPABASE_URL = 'https://bgywofuljhglscwjulen.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXdvZnVsamhnbHNjd2p1bGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTIwNDYsImV4cCI6MjEwMjI2ODA0Nn0.qDYuQGkM6v4IiFhUF4C6XAsFXt7cPnMYZv_zY1zOnzU';

// ----- REMEMBER ME -----
// By default, Supabase persists the session to localStorage regardless of
// any checkbox, which means "stay logged in" always happens whether the
// person asked for it or not. To make "Remember me" a real choice, we
// give the Supabase client a custom storage adapter that checks a small
// flag (itself in localStorage — it's just a boolean, not the session)
// each time it reads/writes: if "remember me" was checked at login, the
// actual session token goes to localStorage (survives closing the
// browser); if not, it goes to sessionStorage (cleared the moment the
// tab/browser closes), same as a "remember me" checkbox is expected to
// behave anywhere else.
const REMEMBER_ME_FLAG = 'ftlms-remember-me';
function preferredAuthStorage() {
    return localStorage.getItem(REMEMBER_ME_FLAG) === '1' ? window.localStorage : window.sessionStorage;
}
const hybridAuthStorage = {
    getItem: (key) => preferredAuthStorage().getItem(key),
    setItem: (key, value) => preferredAuthStorage().setItem(key, value),
    removeItem: (key) => preferredAuthStorage().removeItem(key)
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storage: hybridAuthStorage }
});

const FTLMS_EMAIL_DOMAIN = 'ftlms.local';
const usernameToEmail = (username) => `${username.trim().toLowerCase()}@${FTLMS_EMAIL_DOMAIN}`;

function mapProfile(row) {
    if (!row) return null;
    return {
        username: row.username,
        name: row.name,
        role: row.role,
        dept: row.dept,
        isAdmin: row.is_admin,
        status: row.status,
        last: row.last_active ? new Date(row.last_active).toISOString() : 'Never',
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        deleted: row.deleted
    };
}

async function callEdgeFunction(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) {
        // Edge Functions return { error: "..." } in the body on failure —
        // supabase-js's `error` here is the HTTP-level error, so pull the
        // real message out of the response body when we can.
        let message = error.message;
        try {
            const ctx = await error.context.json();
            if (ctx && ctx.error) message = ctx.error;
        } catch { /* fall back to the generic message above */ }
        throw new Error(message);
    }
    if (data && data.error) throw new Error(data.error);
    return data;
}

const api = {
    async login(username, password, rememberMe) {
        // Set the preference BEFORE signing in, since Supabase writes the
        // new session the moment sign-in succeeds — the storage adapter
        // needs to already know which backend to use for that first write.
        // Wrapped separately so a storage quirk (e.g. private browsing
        // restrictions in some browsers) can't get misread as a login
        // failure — it just silently falls back to session-only behavior.
        try {
            localStorage.setItem(REMEMBER_ME_FLAG, rememberMe ? '1' : '0');
        } catch { /* storage unavailable — proceed with login regardless */ }

        const { data, error } = await sb.auth.signInWithPassword({
            email: usernameToEmail(username),
            password
        });
        if (error) {
            // Surface Supabase's actual reason rather than a hardcoded
            // generic message — masking it here makes genuine problems
            // (network issues, rate limiting, project misconfiguration)
            // indistinguishable from an actually-wrong password, which
            // makes this impossible to diagnose from the outside.
            if (/invalid login credentials/i.test(error.message)) {
                throw new Error('Invalid username or password');
            }
            throw new Error(error.message || 'Login failed');
        }

        const { data: profileRow } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
        const user = mapProfile(profileRow);
        if (!user || user.deleted) {
            await sb.auth.signOut();
            throw new Error('Invalid username or password');
        }
        if (user.status === 'Inactive') {
            await sb.auth.signOut();
            throw new Error('This account is inactive. Contact your administrator.');
        }
        await sb.rpc('touch_last_active');
        return { user };
    },

    async logout() {
        await sb.auth.signOut();
        localStorage.removeItem(REMEMBER_ME_FLAG);
        return { ok: true };
    },

    async me() {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        const { data: profileRow } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
        const user = mapProfile(profileRow);
        if (!user || user.deleted) throw new Error('Not authenticated');
        if (user.status === 'Inactive') {
            await sb.auth.signOut();
            throw new Error('ACCOUNT_INACTIVE');
        }
        return { user };
    },

    async getState() {
        const [{ data: stateRow, error: stateErr }, { data: profileRows, error: usersErr }] = await Promise.all([
            sb.from('app_state').select('*').eq('id', 1).single(),
            sb.from('profiles').select('*').order('created_at', { ascending: false })
        ]);
        if (stateErr) throw new Error(stateErr.message);
        if (usersErr) throw new Error(usersErr.message);
        return {
            tyres: stateRow.tyres || [],
            equipment: stateRow.equipment || [],
            inspections: stateRow.inspections || [],
            activityLog: stateRow.activity_log || [],
            configLists: stateRow.config_lists || null,
            users: profileRows.map(mapProfile),
            updatedAt: new Date(stateRow.updated_at).getTime()
        };
    },

    async saveState({ tyres, equipment, inspections, activityLog, configLists }) {
        const payload = { tyres, equipment, inspections, activity_log: activityLog };
        // Only include config_lists in the write when the caller actually
        // supplied it — this keeps every ordinary save (tyres, equipment,
        // etc.) from ever touching this column, so the admin-only trigger
        // never fires unless someone is really editing a dropdown list.
        if (configLists !== undefined) payload.config_lists = configLists;
        const { data: stateRow, error } = await sb
            .from('app_state')
            .update(payload)
            .eq('id', 1)
            .select()
            .single();
        if (error) throw new Error(error.message);
        const { data: profileRows } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
        return {
            tyres: stateRow.tyres || [],
            equipment: stateRow.equipment || [],
            inspections: stateRow.inspections || [],
            activityLog: stateRow.activity_log || [],
            configLists: stateRow.config_lists || null,
            users: (profileRows || []).map(mapProfile),
            updatedAt: new Date(stateRow.updated_at).getTime()
        };
    },

    async resetAll() {
        return callEdgeFunction('admin-reset-all');
    },

    async createUser(user) {
        const result = await callEdgeFunction('admin-create-user', user);
        return { user: mapProfile(result.user) };
    },

    async updateUserFields(username, fields) {
        // Maps the app's camelCase field names onto the table's snake_case
        // columns. Only ever touches non-password fields — password
        // changes always go through setPassword() / the Edge Function.
        const columnMap = { isAdmin: 'is_admin' };
        const payload = {};
        for (const [key, value] of Object.entries(fields)) {
            payload[columnMap[key] || key] = value;
        }
        const { data, error } = await sb.from('profiles').update(payload).eq('username', username).select().single();
        if (error) throw new Error(error.message);
        return { user: mapProfile(data) };
    },

    async setPassword(username, password) {
        return callEdgeFunction('admin-set-password', { username, password });
    },

    async purgeUser(username) {
        return callEdgeFunction('admin-purge-user', { username });
    },

    // ----- Realtime -----
    // Pushes updates instead of polling. Debounced slightly so a burst of
    // several quick saves doesn't trigger a re-render per row change.
    _channel: null,
    subscribeToChanges(onChange) {
        this.unsubscribe();
        let debounceTimer = null;
        const debounced = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(onChange, 400);
        };
        this._channel = sb
            .channel('ftlms-shared-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, debounced)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debounced)
            .subscribe();
    },
    unsubscribe() {
        if (this._channel) { sb.removeChannel(this._channel); this._channel = null; }
    }
};

window.api = api;