# FTLMS — Supabase Setup

This replaces the earlier hand-rolled Express backend with Supabase:
real managed Postgres, real Auth (proper password hashing, done by
Supabase, not by me), Row Level Security enforced by the database itself,
and genuine push-based Realtime. The frontend is now a fully static site
that talks to Supabase directly — nothing for you to host/run yourself
besides the static files.

## What actually changed, security-wise

| Before (localStorage) | Now |
|---|---|
| Passwords in plaintext, visible via DevTools console | Passwords owned entirely by Supabase Auth — this app never sees or stores one |
| "Login" = checking a local array | Real server-verified session, industry-standard auth |
| Access control = whatever the UI chose to hide | Enforced by Postgres Row Level Security — same result even if someone bypasses the UI and calls the API directly |
| No shared visibility | Everyone authorized sees the same live data, pushed in real time |

## 1. Create the Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Pick a name,
region, and database password (save that password somewhere safe — it's
separate from any app login). Wait for it to finish provisioning.

## 2. Run the database migration

Studio → **SQL Editor** → New query → paste the entire contents of
`supabase/migrations/0001_init.sql` → **Run**.

This creates the `profiles` and `app_state` tables and, importantly, the
Row Level Security policies that are the actual security boundary for
this app.

## 3. Get your API keys

Studio → **Project Settings → API**. You need two values:
- **Project URL**
- **anon / public key**

Open `frontend/js/api.js` and replace the two placeholder constants near
the top:
```js
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-PUBLIC-ANON-KEY';
```

These are meant to be public and safe to ship in the frontend — that's
how Supabase's anon key + RLS model works. **Do not** put the
`service_role` key anywhere in `frontend/` — it bypasses RLS entirely and
must only ever live inside the Edge Functions (Supabase injects it there
automatically, you don't set it yourself).

## 4. Deploy the Edge Functions

These three privileged actions (create a user, reset a password, wipe
everything) need the `service_role` key, so they run as Edge Functions,
not from the browser directly.

Install the CLI and deploy:
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy admin-create-user
supabase functions deploy admin-set-password
supabase functions deploy admin-reset-all
```

## 5. Create the first admin account (one-time, manual)

There's a chicken-and-egg problem: creating a user normally requires an
existing admin to call the `admin-create-user` function — but there is no
admin yet. So the very first account is created by hand, once:

1. Studio → **Authentication → Users → Add user**. Email:
   `admin@ftlms.local`, password: pick something you'll actually
   remember (this becomes the real admin password — change it in-app
   later if you want, from Profile).
2. Studio → **SQL Editor**, run:
   ```sql
   insert into public.profiles (id, username, name, role, dept, is_admin, status)
   select id, 'admin', 'Administrator', 'Administrator', '—', true, 'Active'
   from auth.users where email = 'admin@ftlms.local';
   ```

Log in with username `admin` and that password. From here on, create
every other real account through the app's Users page — that goes
through the `admin-create-user` function properly.

## 6. Host the frontend

`frontend/` is now just static files (HTML/CSS/JS) — no server needed.
Any static host works: Vercel, Netlify, Cloudflare Pages, GitHub Pages, a
plain S3 bucket, etc. Point it at the `frontend/` folder and deploy.

**Use HTTPS** (all of the hosts above give you this by default on their
domain). Supabase's own connections are HTTPS already; this is about the
page your users actually load.

## Known limitations (honest, on purpose)

- **`app_state` is JSON blob columns, not fully relational tables.**
  Tyres/equipment/inspections/activity are stored as JSON, matching the
  shape the frontend already used with localStorage, so the bulk of the
  existing frontend code didn't need rewriting. `profiles` (accounts) *is*
  a proper relational table with real RLS, since that's where the actual
  security-sensitive logic lives. A fully normalized schema for tyres/
  equipment/inspections (separate tables, foreign keys, per-row RLS) is a
  reasonable v2 if this grows — it would let you restrict who can edit
  which specific records, not just an all-or-nothing "any authorized user
  can write" policy.
- **"Last write wins" on `app_state`.** Two people saving at the exact
  same moment can have one overwrite the other's change — same trade-off
  the old localStorage version had, just shared now instead of trapped in
  one browser.
- **Synthetic email addresses.** Supabase Auth requires an email address;
  since this app uses usernames, each account gets a fake
  `username@ftlms.local` email under the hood. This is invisible to users
  (they only ever type a username) but means real email-based flows
  (password-reset emails, email verification) aren't wired up — password
  resets go through the admin instead, matching how this app already
  worked.
- **I could not create an actual Supabase project or run any of this
  end-to-end** — that requires an account only you can set up, and this
  sandbox has no network access besides. Everything here is written
  carefully (the SQL, the RLS policies, the Edge Functions) but please
  actually click through login → create a second user → register a tyre
  → log out → log back in as that user and confirm they see it, before
  relying on this for real work. Tell me what breaks and I'll fix it.
