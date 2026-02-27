# Supabase Setup (Cloud Save v1)

## 1) Create project

1. Create a Supabase project.
2. In Supabase Dashboard, open **Project Settings > API**.
3. Copy:
   - Project URL
   - anon/public key

## 2) Configure Blurt env

Create `blurt/.env` from `blurt/.env.example` and set:

```bash
VITE_STORAGE_MODE=cloud
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_SUPABASE_REDIRECT_URL=blurt://auth/callback
```

Use `VITE_STORAGE_MODE=hybrid` if you want cloud primary + local mirror.

## 3) Create tables

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer,
  title text not null,
  prompt text,
  duration_sec integer not null,
  started_at_ms bigint not null,
  ended_at_ms bigint,
  notes jsonb not null default '[]'::jsonb,
  updated_at_ms bigint not null
);

create table if not exists public.templates (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title_default text not null,
  prompt_default text,
  duration_sec_default integer not null,
  updated_at_ms bigint not null
);

create index if not exists sessions_user_started_idx on public.sessions(user_id, started_at_ms desc);
create index if not exists templates_user_updated_idx on public.templates(user_id, updated_at_ms desc);
```

## 4) Enable row-level security (RLS)

Run this SQL:

```sql
alter table public.sessions enable row level security;
alter table public.templates enable row level security;

create policy "sessions_select_own" on public.sessions
for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on public.sessions
for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on public.sessions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_delete_own" on public.sessions
for delete using (auth.uid() = user_id);

create policy "templates_select_own" on public.templates
for select using (auth.uid() = user_id);

create policy "templates_insert_own" on public.templates
for insert with check (auth.uid() = user_id);

create policy "templates_update_own" on public.templates
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "templates_delete_own" on public.templates
for delete using (auth.uid() = user_id);
```

## 5) Auth provider settings

Enable **Email + Password** in **Authentication > Providers > Email**.
For local testing, disable email confirmation requirement so account creation signs in immediately.

Also add this redirect URL in **Authentication > URL Configuration > Redirect URLs**:

```
blurt://auth/callback
```

## 6) Verify (desktop deep link)

1. Run `npm run tauri dev` in `blurt/`.
2. You should see email login prompt.
3. Click the magic-link button in email and confirm it opens/re-auths the Blurt app.
4. Start a session, add notes, end session.
5. Confirm data appears in Supabase `sessions` table.

## 7) Optional alternatives

- Email OTP / magic link and SMS can still be configured later.
- Current app flow now uses email+password directly in-app (no browser redirect required).
