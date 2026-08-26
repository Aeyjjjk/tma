// Shared helpers for FTLMS Edge Functions.
// Deno / TypeScript — deployed with `supabase functions deploy <name>`.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // tighten to your real domain once deployed
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// A client authenticated AS the calling user (respects RLS) — used only
// to verify who's calling and whether they're an admin.
export function callerClient(req: Request): SupabaseClient {
    return createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
}

// A privileged client using the service_role key — this is what's
// actually allowed to create/modify Supabase Auth users. The service_role
// key lives only in this Edge Function's environment (a Supabase secret),
// never in the frontend, never in a browser.
export function adminClient(): SupabaseClient {
    return createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
}

// Verifies the request carries a valid session AND that user is an
// active, non-deleted admin. Returns their profile row, or null.
export async function requireAdminCaller(req: Request) {
    const supabase = callerClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    if (!profile || !profile.is_admin || profile.deleted) return null;
    return profile;
}

// Verifies just that the caller has a valid session (any authorized
// user), for endpoints that allow self-service (e.g. changing your own
// password) as well as admin use.
export async function requireAuthenticatedCaller(req: Request) {
    const supabase = callerClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

export const FTLMS_EMAIL_DOMAIN = 'ftlms.local';
export function usernameToEmail(username: string) {
    return `${username.toLowerCase()}@${FTLMS_EMAIL_DOMAIN}`;
}
